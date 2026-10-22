import { Edge, MarkerType, Node } from '@xyflow/react';

export type Side = 'left' | 'right' | 'top' | 'bottom';
export type Marking = Record<string, number>;
type Point = { x: number; y: number };

/** Rendered shape sizes; example layouts and label offsets depend on these. */
export const NODE_SIZE: Record<string, { width: number; height: number }> = {
  place: { width: 56, height: 56 },
  transition: { width: 24, height: 64 },
};

/** Whole-node drop zones, rendered on every node and active only while connecting. */
export const AUTO_SOURCE_HANDLE = 'source-auto';
export const AUTO_TARGET_HANDLE = 'target-auto';

export function isAutoHandle(handleId?: string | null) {
  return handleId === AUTO_SOURCE_HANDLE || handleId === AUTO_TARGET_HANDLE;
}

export function nodeSize(node: Node) {
  const fallback = NODE_SIZE[node.type ?? 'place'] ?? NODE_SIZE.place;
  return {
    width: node.measured?.width ?? fallback.width,
    height: node.measured?.height ?? fallback.height,
  };
}

export function nodeCenter(node: Node): Point {
  const { width, height } = nodeSize(node);
  return { x: node.position.x + width / 2, y: node.position.y + height / 2 };
}

export function sideOfHandle(handleId?: string | null): Side | null {
  const side = handleId?.split('-')[1];
  return side === 'left' || side === 'right' || side === 'top' || side === 'bottom' ? side : null;
}

/** Sides that face each other along the dominant axis between two centres. */
export function pickSides(from: Point, to: Point): { sourceSide: Side; targetSide: Side } {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? { sourceSide: 'right', targetSide: 'left' } : { sourceSide: 'left', targetSide: 'right' };
  }
  return dy >= 0 ? { sourceSide: 'bottom', targetSide: 'top' } : { sourceSide: 'top', targetSide: 'bottom' };
}

export function autoHandles(source: Node, target: Node) {
  const { sourceSide, targetSide } = pickSides(nodeCenter(source), nodeCenter(target));
  return { sourceHandle: `source-${sourceSide}`, targetHandle: `target-${targetSide}` };
}

export function newId(prefix: string) {
  return `${prefix}${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function createArc(
  source: Node,
  target: Node,
  handles: { sourceHandle: string; targetHandle: string } = autoHandles(source, target),
  weight = 1
): Edge {
  return {
    id: newId(`e-${source.id}-${target.id}-`),
    source: source.id,
    target: target.id,
    ...handles,
    type: 'weighted',
    // Same shape as the bundled examples; the canvas draws its own themed arrowhead
    markerEnd: { type: MarkerType.ArrowClosed, color: '#2e3440' },
    data: { weight },
  };
}

/** First free name of the form p1, p2, … (or t1, t2, …). */
export function uniqueName(prefix: string, nodes: Node[]) {
  const used = new Set(nodes.map((n) => n.data?.name as string));
  let i = nodes.filter((n) => n.type === (prefix === 'p' ? 'place' : 'transition')).length + 1;
  while (used.has(`${prefix}${i}`)) i++;
  return `${prefix}${i}`;
}

/**
 * Cleans a loaded model in memory: drops editor-only flags (selection, dragging,
 * animation), registers every arc as a weighted arc and fills in missing sides.
 * The source files are never touched.
 */
export function normalizeModel(rawNodes: any[], rawEdges: any[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = rawNodes.map(({ selected, dragging, ...node }) => ({ ...node, data: { ...node.data } }));
  const byId = new Map(nodes.map((n) => [n.id, n]));

  const edges: Edge[] = rawEdges
    .filter((e) => byId.has(e.source) && byId.has(e.target))
    .map(({ selected, ...edge }) => {
      const { isFiring, ...data } = edge.data ?? {};
      const hasSides = sideOfHandle(edge.sourceHandle) && sideOfHandle(edge.targetHandle) && !isAutoHandle(edge.sourceHandle) && !isAutoHandle(edge.targetHandle);
      return {
        ...edge,
        type: 'weighted',
        ...(hasSides ? {} : autoHandles(byId.get(edge.source)!, byId.get(edge.target)!)),
        data: { ...data, weight: Number(data.weight) || 1 },
      };
    });

  return { nodes, edges };
}

/** Removes transient editor state so saved files describe only the model. */
export function stripForExport(nodes: Node[], edges: Edge[]) {
  return {
    nodes: nodes.map(({ selected, dragging, measured, ...node }) => {
      const { isEnabled, ...data } = node.data ?? {};
      return { ...node, data };
    }),
    edges: edges.map(({ selected, ...edge }) => {
      const { isFiring, ...data } = edge.data ?? {};
      return { ...edge, data };
    }),
  };
}

export function markingOf(nodes: Node[]): Marking {
  const marking: Marking = {};
  for (const n of nodes) {
    if (n.type === 'place') marking[n.id] = Number(n.data?.tokens) || 0;
  }
  return marking;
}

export function applyMarking(nodes: Node[], marking: Marking): Node[] {
  let changed = false;
  const next = nodes.map((n) => {
    if (n.type !== 'place' || !(n.id in marking) || n.data?.tokens === marking[n.id]) return n;
    changed = true;
    return { ...n, data: { ...n.data, tokens: marking[n.id] } };
  });
  return changed ? next : nodes;
}

export function sameMarking(a: Marking, b: Marking) {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k]);
}
