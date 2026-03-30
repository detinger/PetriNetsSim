import { Node, Edge } from '@xyflow/react';

interface PnmlPlace {
  id: string;
  name: string;
  tokens: number;
  x: number;
  y: number;
}

interface PnmlTransition {
  id: string;
  name: string;
  x: number;
  y: number;
}

interface PnmlArc {
  id: string;
  source: string;
  target: string;
  weight: number;
}

/**
 * Parse a PNML XML string and return ReactFlow-compatible nodes and edges.
 * Handles the standard PNML format (ISO/IEC 15909) as well as common
 * tool-specific variants (PIPE, GreatSPN, WoPeD, etc.).
 */
export function parsePnml(xmlText: string): { nodes: Node[]; edges: Edge[] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, 'application/xml');

  const parseError = doc.querySelector('parsererror');
  if (parseError) {
    throw new Error('Invalid PNML/XML: ' + parseError.textContent?.slice(0, 200));
  }

  // Collect all <place>, <transition>, <arc> elements from all <net> elements
  const allPlaces: PnmlPlace[] = [];
  const allTransitions: PnmlTransition[] = [];
  const allArcs: PnmlArc[] = [];

  // Track all element ids to know whether an arc endpoint is a place or transition
  const placeIds = new Set<string>();
  const transitionIds = new Set<string>();

  const nets = Array.from(doc.querySelectorAll('net'));
  if (nets.length === 0) {
    throw new Error('No <net> element found in PNML file.');
  }

  for (const net of nets) {
    // Places
    for (const el of Array.from(net.querySelectorAll('place'))) {
      const id = el.getAttribute('id') ?? '';
      if (!id) continue;

      const name = getLabel(el) || id;
      const tokens = getInitialMarking(el);
      const { x, y } = getPosition(el);

      allPlaces.push({ id, name, tokens, x, y });
      placeIds.add(id);
    }

    // Transitions
    for (const el of Array.from(net.querySelectorAll('transition'))) {
      const id = el.getAttribute('id') ?? '';
      if (!id) continue;

      const name = getLabel(el) || id;
      const { x, y } = getPosition(el);

      allTransitions.push({ id, name, x, y });
      transitionIds.add(id);
    }

    // Arcs
    for (const el of Array.from(net.querySelectorAll('arc'))) {
      const id = el.getAttribute('id') ?? `arc-${Math.random().toString(36).slice(2)}`;
      const source = el.getAttribute('source') ?? '';
      const target = el.getAttribute('target') ?? '';
      if (!source || !target) continue;

      const weight = getArcWeight(el);
      allArcs.push({ id, source, target, weight });
    }
  }

  if (allPlaces.length === 0 && allTransitions.length === 0) {
    throw new Error('No places or transitions found in PNML file.');
  }

  // Auto-layout: if no positions are stored (all 0,0), do a simple grid layout
  const hasPositions =
    allPlaces.some((p) => p.x !== 0 || p.y !== 0) ||
    allTransitions.some((t) => t.x !== 0 || t.y !== 0);

  if (!hasPositions) {
    autoLayout(allPlaces, allTransitions, allArcs);
  }

  // Build ReactFlow nodes
  const nodes: Node[] = [
    ...allPlaces.map((p) => ({
      id: p.id,
      type: 'place' as const,
      position: { x: p.x, y: p.y },
      data: { name: p.name, tokens: p.tokens },
    })),
    ...allTransitions.map((t) => ({
      id: t.id,
      type: 'transition' as const,
      position: { x: t.x, y: t.y },
      data: { name: t.name, isEnabled: false },
    })),
  ];

  // Build ReactFlow edges
  const edges: Edge[] = allArcs.map((a) => ({
    id: a.id,
    source: a.source,
    target: a.target,
    type: 'arc',
    data: { weight: a.weight, isFiring: false },
    markerEnd: { type: 'arrowclosed' as any },
  }));

  return { nodes, edges };
}

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Get the human-readable label text from a PNML element. */
function getLabel(el: Element): string {
  // Standard PNML: <name><text>…</text></name>
  const nameEl = el.querySelector(':scope > name > text');
  if (nameEl?.textContent) return nameEl.textContent.trim();

  // Some tools use <name value="…"/>
  const nameAttr = el.querySelector(':scope > name');
  if (nameAttr?.getAttribute('value')) return nameAttr.getAttribute('value')!.trim();

  // Fallback: direct <text> child
  const textEl = el.querySelector(':scope > text');
  if (textEl?.textContent) return textEl.textContent.trim();

  return '';
}

/** Get the initial marking (token count) from a PNML place element. */
function getInitialMarking(el: Element): number {
  // Standard: <initialMarking><text>3</text></initialMarking>
  const markText = el.querySelector(':scope > initialMarking > text');
  if (markText?.textContent) {
    const n = parseInt(markText.textContent.trim(), 10);
    if (!isNaN(n)) return n;
  }

  // Some tools: <initialMarking value="3"/>
  const markEl = el.querySelector(':scope > initialMarking');
  if (markEl) {
    const val = markEl.getAttribute('value');
    if (val) {
      const n = parseInt(val, 10);
      if (!isNaN(n)) return n;
    }
    if (markEl.textContent) {
      const n = parseInt(markEl.textContent.trim(), 10);
      if (!isNaN(n)) return n;
    }
  }

  return 0;
}

/** Get (x, y) position from a PNML element. Returns {0,0} if not present. */
function getPosition(el: Element): { x: number; y: number } {
  // Standard: <graphics><position x="100" y="200"/></graphics>
  const pos = el.querySelector(':scope > graphics > position');
  if (pos) {
    const x = parseFloat(pos.getAttribute('x') ?? '0');
    const y = parseFloat(pos.getAttribute('y') ?? '0');
    if (!isNaN(x) && !isNaN(y)) return { x, y };
  }

  // Some tools put position directly on the element
  const x = parseFloat(el.getAttribute('x') ?? '0');
  const y = parseFloat(el.getAttribute('y') ?? '0');
  if (x !== 0 || y !== 0) return { x, y };

  return { x: 0, y: 0 };
}

/** Get arc weight from a PNML arc element. */
function getArcWeight(el: Element): number {
  // Standard: <inscription><text>2</text></inscription>
  const inscText = el.querySelector(':scope > inscription > text');
  if (inscText?.textContent) {
    const n = parseInt(inscText.textContent.trim(), 10);
    if (!isNaN(n) && n > 0) return n;
  }

  // Some tools: <inscription value="2"/>
  const inscEl = el.querySelector(':scope > inscription');
  if (inscEl) {
    const val = inscEl.getAttribute('value');
    if (val) {
      const n = parseInt(val, 10);
      if (!isNaN(n) && n > 0) return n;
    }
    if (inscEl.textContent) {
      const n = parseInt(inscEl.textContent.trim(), 10);
      if (!isNaN(n) && n > 0) return n;
    }
  }

  // weight attribute directly on arc
  const w = parseInt(el.getAttribute('weight') ?? '1', 10);
  return isNaN(w) || w < 1 ? 1 : w;
}

/**
 * Simple automatic layout for nets without position data.
 * Arranges places and transitions alternately in a layered grid pattern
 * using a basic topological sort heuristic.
 */
function autoLayout(
  places: PnmlPlace[],
  transitions: PnmlTransition[],
  arcs: PnmlArc[]
): void {
  const HGAP = 180;
  const VGAP = 120;

  // Build adjacency to determine rough layers
  const outgoing = new Map<string, string[]>();
  const incoming = new Map<string, Set<string>>();

  const allIds = [
    ...places.map((p) => p.id),
    ...transitions.map((t) => t.id),
  ];

  for (const id of allIds) {
    outgoing.set(id, []);
    incoming.set(id, new Set());
  }

  for (const arc of arcs) {
    outgoing.get(arc.source)?.push(arc.target);
    incoming.get(arc.target)?.add(arc.source);
  }

  // Kahn's algorithm for topological sort
  const layer = new Map<string, number>();
  const queue: string[] = [];
  for (const id of allIds) {
    if ((incoming.get(id)?.size ?? 0) === 0) queue.push(id);
  }

  while (queue.length > 0) {
    const id = queue.shift()!;
    const l = layer.get(id) ?? 0;
    for (const next of outgoing.get(id) ?? []) {
      const nextLayer = Math.max(layer.get(next) ?? 0, l + 1);
      layer.set(next, nextLayer);
      // Only add to queue when all predecessors processed
      const predDone = [...(incoming.get(next) ?? [])].every((pred) => layer.has(pred));
      if (predDone && !queue.includes(next)) queue.push(next);
    }
  }

  // Group by layer
  const byLayer = new Map<number, string[]>();
  for (const id of allIds) {
    const l = layer.get(id) ?? 0;
    if (!byLayer.has(l)) byLayer.set(l, []);
    byLayer.get(l)!.push(id);
  }

  const placeMap = new Map(places.map((p) => [p.id, p]));
  const transMap = new Map(transitions.map((t) => [t.id, t]));

  const maxLayer = Math.max(...byLayer.keys());
  for (let l = 0; l <= maxLayer; l++) {
    const ids = byLayer.get(l) ?? [];
    ids.forEach((id, i) => {
      const x = l * HGAP + 80;
      const y = i * VGAP + 80;
      const p = placeMap.get(id);
      if (p) { p.x = x; p.y = y; return; }
      const t = transMap.get(id);
      if (t) { t.x = x; t.y = y; }
    });
  }
}
