import { useMemo } from 'react';
import { clsx } from 'clsx';
import { Network } from 'lucide-react';
import { markingKey, NetAnalysis, OMEGA, STATE_LIMIT } from '../../lib/analysis';

/** Graphs larger than this are listed but not drawn. */
const DRAW_LIMIT = 60;
const TABLE_LIMIT = 300;
const NODE_HEIGHT = 34;
const LAYER_GAP = 58;
const NODE_GAP = 20;
const MARGIN = 16;
const CHAR_WIDTH = 6.8;
/** Room beside the layers for back edges and self-loops. */
const SIDE_ROOM = 72;

const formatValue = (v: number) => (v === OMEGA ? 'ω' : String(v));
const formatMarking = (m: number[]) => `(${m.map(formatValue).join(', ')})`;

interface LaidOutState {
  id: number;
  x: number;
  y: number;
  width: number;
}

function layout(analysis: NetAnalysis) {
  const layers: number[][] = [];
  for (const s of analysis.states) (layers[s.depth] ??= []).push(s.id);

  const predecessors = new Map<number, number[]>();
  for (const e of analysis.edges) {
    if (analysis.states[e.from].depth === analysis.states[e.to].depth - 1) {
      predecessors.set(e.to, [...(predecessors.get(e.to) ?? []), e.from]);
    }
  }

  // One barycentre pass keeps children under their parents and reduces crossings
  const order = new Map<number, number>();
  layers.forEach((layer, depth) => {
    if (depth > 0) {
      const weight = (id: number) => {
        const preds = predecessors.get(id) ?? [];
        return preds.length ? preds.reduce((a, p) => a + order.get(p)!, 0) / preds.length : Infinity;
      };
      layer.sort((a, b) => weight(a) - weight(b));
    }
    layer.forEach((id, i) => order.set(id, i));
  });

  const widthOf = (id: number) =>
    Math.max(56, Math.max(formatMarking(analysis.states[id].marking).length, `M${id}`.length) * CHAR_WIDTH + 16);
  const layerWidths = layers.map((layer) => layer.reduce((sum, id) => sum + widthOf(id), 0) + NODE_GAP * (layer.length - 1));
  const maxWidth = Math.max(...layerWidths);

  const placed = new Map<number, LaidOutState>();
  layers.forEach((layer, depth) => {
    let x = MARGIN + SIDE_ROOM + (maxWidth - layerWidths[depth]) / 2;
    for (const id of layer) {
      const width = widthOf(id);
      placed.set(id, { id, x, y: MARGIN + depth * (NODE_HEIGHT + LAYER_GAP), width });
      x += width + NODE_GAP;
    }
  });

  return {
    placed,
    centerX: MARGIN + SIDE_ROOM + maxWidth / 2,
    width: maxWidth + MARGIN * 2 + SIDE_ROOM * 2,
    height: MARGIN * 2 + layers.length * NODE_HEIGHT + (layers.length - 1) * LAYER_GAP,
  };
}

function edgeGeometry(from: LaidOutState, to: LaidOutState, lane: number, centerX: number) {
  if (from.id === to.id) {
    const x = from.x + from.width;
    const y = from.y;
    return {
      d: `M ${x} ${y + 9} C ${x + 34} ${y - 8}, ${x + 34} ${y + NODE_HEIGHT + 8}, ${x} ${y + NODE_HEIGHT - 9}`,
      labelX: x + 30,
      labelY: y + NODE_HEIGHT / 2 + 4,
      anchor: 'start' as const,
    };
  }
  if (to.y > from.y) {
    const sx = from.x + from.width / 2;
    const sy = from.y + NODE_HEIGHT;
    const tx = to.x + to.width / 2;
    const ty = to.y;
    const mid = (sy + ty) / 2;
    return {
      d: `M ${sx} ${sy} C ${sx} ${mid}, ${tx} ${mid}, ${tx} ${ty}`,
      labelX: (sx + tx) / 2,
      labelY: mid + 4,
      anchor: 'middle' as const,
    };
  }
  // Back edges and same-layer edges loop around the side nearer to the source
  const left = from.x + from.width / 2 < centerX;
  const sx = left ? from.x : from.x + from.width;
  const sy = from.y + NODE_HEIGHT / 2 + 5;
  const tx = left ? to.x : to.x + to.width;
  const ty = to.y + NODE_HEIGHT / 2 - 5;
  const bulge = left ? Math.min(sx, tx) - 28 - lane * 10 : Math.max(sx, tx) + 28 + lane * 10;
  return {
    d: `M ${sx} ${sy} C ${bulge} ${sy}, ${bulge} ${ty}, ${tx} ${ty}`,
    labelX: left ? bulge + 4 : bulge - 4,
    labelY: (sy + ty) / 2 + 4,
    anchor: left ? ('end' as const) : ('start' as const),
  };
}

export default function ReachabilityPanel({
  analysis,
  placeNames,
  currentMarking,
  nameOf,
}: {
  analysis: NetAnalysis | null;
  placeNames: string[];
  currentMarking: number[];
  nameOf: (id: string) => string;
}) {
  const drawable = analysis && analysis.states.length <= DRAW_LIMIT;
  const graph = useMemo(() => (analysis && drawable ? layout(analysis) : null), [analysis, drawable]);

  if (!analysis) {
    return (
      <div className="empty-state">
        <Network aria-hidden="true" />
        <h4>No markings to explore</h4>
        <p>Add places and transitions to see which markings the net can reach from M₀.</p>
      </div>
    );
  }

  const currentKey = markingKey(currentMarking);
  const deadIds = new Set(analysis.deadIds);
  const successors = (id: number) => analysis.edges.filter((e) => e.from === id);

  return (
    <div>
      <p className="hint mb-3">
        {analysis.hasOmega
          ? `Coverability graph: ω marks a place that can hold any number of tokens. ${analysis.states.length} markings.`
          : analysis.truncated
            ? `Showing the first ${STATE_LIMIT.toLocaleString()} reachable markings; the full graph is larger.`
            : `${analysis.states.length} reachable ${analysis.states.length === 1 ? 'marking' : 'markings'} from M₀.`}{' '}
        Markings list tokens in the order {placeNames.length ? placeNames.join(', ') : 'of the places'}.
      </p>

      {graph ? (
        <div className="graph-viewer" role="img" aria-label={`Reachability graph with ${analysis.states.length} markings`}>
          <svg width={graph.width} height={graph.height} className="block">
            <defs>
              <marker id="rg-arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" markerUnits="userSpaceOnUse" orient="auto">
                <path d="M0 1 L10 5 L0 9 Z" className="fill-fg-muted" />
              </marker>
            </defs>
            {analysis.edges.map((e, i) => {
              const geometry = edgeGeometry(graph.placed.get(e.from)!, graph.placed.get(e.to)!, i % 4, graph.centerX);
              const label = e.transitions.map(nameOf).join(', ');
              return (
                <g key={`${e.from}-${e.to}`}>
                  <path d={geometry.d} fill="none" className="stroke-fg-muted" strokeWidth={1.25} markerEnd="url(#rg-arrow)" />
                  <text x={geometry.labelX} y={geometry.labelY} textAnchor={geometry.anchor} className="rg-label">
                    {label.length > 22 ? `${label.slice(0, 21)}…` : label}
                    <title>{label}</title>
                  </text>
                </g>
              );
            })}
            {analysis.states.map((s) => {
              const box = graph.placed.get(s.id)!;
              const current = markingKey(s.marking) === currentKey;
              return (
                <g key={s.id} className={clsx('rg-state', s.id === 0 && 'rg-initial', current && 'rg-current', deadIds.has(s.id) && 'rg-dead')}>
                  <title>
                    {`M${s.id}: ${placeNames.map((n, i) => `${n}=${formatValue(s.marking[i])}`).join(', ')}${deadIds.has(s.id) ? ' (dead)' : ''}`}
                  </title>
                  <rect x={box.x} y={box.y} width={box.width} height={NODE_HEIGHT} rx={6} />
                  <text x={box.x + box.width / 2} y={box.y + 13} textAnchor="middle" className="rg-name">
                    {s.id === 0 ? 'M₀' : `M${s.id}`}
                  </text>
                  <text x={box.x + box.width / 2} y={box.y + 27} textAnchor="middle" className="rg-marking">
                    {formatMarking(s.marking)}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <div className="callout mb-3">
          <Network aria-hidden="true" />
          <div>The graph has {analysis.states.length.toLocaleString()} markings, too many to draw. They are listed below.</div>
        </div>
      )}

      {graph && (
        <div className="mt-2 mb-4 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-fg-muted">
          <span className="flex items-center gap-1.5"><span className="rg-swatch rg-swatch-initial" /> Initial M₀</span>
          <span className="flex items-center gap-1.5"><span className="rg-swatch rg-swatch-current" /> Current marking</span>
          <span className="flex items-center gap-1.5"><span className="rg-swatch rg-swatch-dead" /> Dead marking</span>
        </div>
      )}

      <div className="table-wrap max-h-[420px] overflow-y-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">State</th>
              {placeNames.map((name, i) => (
                <th key={i} scope="col" className="num">{name}</th>
              ))}
              <th scope="col">Next</th>
            </tr>
          </thead>
          <tbody>
            {analysis.states.slice(0, TABLE_LIMIT).map((s) => (
              <tr key={s.id} className={clsx(markingKey(s.marking) === currentKey && 'is-current')}>
                <th scope="row">{s.id === 0 ? 'M₀' : `M${s.id}`}</th>
                {s.marking.map((v, i) => (
                  <td key={i} className={clsx('num', v === 0 && 'text-fg-subtle')}>{formatValue(v)}</td>
                ))}
                <td className="text-[12px] text-fg-muted">
                  {deadIds.has(s.id) ? (
                    <span className="badge badge-error">Dead</span>
                  ) : (
                    successors(s.id)
                      .map((e) => `${e.transitions.map(nameOf).join('/')} → ${e.to === 0 ? 'M₀' : `M${e.to}`}`)
                      .join(', ')
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {analysis.states.length > TABLE_LIMIT && (
        <p className="hint mt-2">Showing the first {TABLE_LIMIT} of {analysis.states.length.toLocaleString()} markings.</p>
      )}
    </div>
  );
}
