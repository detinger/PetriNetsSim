import { useRef, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, useInternalNode } from '@xyflow/react';
import { clsx } from 'clsx';
import { arcPath } from '../../lib/arcGeometry';
import { useCanvas } from '../CanvasContext';

export default function WeightedArc({
  id,
  source,
  target,
  data,
  selected,
}: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const {
    isPlaying,
    firingEdgeIds,
    firingKey,
    firingMs,
    overlappingEdgeIds,
    hoveredEdgeId,
    editingEdgeId,
    setEditingEdgeId,
    commitWeight,
  } = useCanvas();

  if (!sourceNode || !targetNode) return null;

  const [edgePath, labelX, labelY, start, end] = arcPath({
    source: sourceNode,
    target: targetNode,
    parallel: overlappingEdgeIds.has(id),
  });

  const weight = Number(data?.weight) || 1;
  const editing = editingEdgeId === id;
  const showBadge = weight > 1 || selected || hoveredEdgeId === id;
  const badgeInteractive = weight > 1 || selected;
  const isFiring = firingEdgeIds.has(id);

  const markerId = `petri-arrow-${id.replace(/[^\w-]/g, '_')}`;

  // How many tokens to animate: capped at 4 to avoid clutter
  const tokenCount = Math.min(weight, 4);
  // Stagger each token by 80ms
  const staggerMs = 80;

  return (
    <>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="0"
          refY="5"
          markerWidth="10"
          markerHeight="10"
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path d="M0 1 L10 5 L0 9 Z" className={clsx('petri-arc-arrow', isFiring && 'petri-arc-firing-arrow')} />
        </marker>
      </defs>

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={`url(#${markerId})`}
        className={clsx('petri-arc', isFiring && 'petri-arc-firing')}
        style={{ strokeWidth: selected ? 2.5 : 2 }}
      />

      {selected && !isPlaying && (
        <g className="petri-arc-ends" aria-hidden="true">
          <circle cx={start.x} cy={start.y} r={4} />
          <circle cx={end.x} cy={end.y} r={4} />
        </g>
      )}

      {/* Animated tokens: one per weight (capped at 4), staggered */}
      {isFiring && Array.from({ length: tokenCount }).map((_, i) => (
        <circle
          key={`${firingKey}-${i}`}
          r={i === 0 ? 6 : 4.5}
          className="fill-accent stroke-net-fill"
          strokeWidth={1.5}
          style={{ filter: 'drop-shadow(0 0 3px color-mix(in srgb, var(--accent) 80%, transparent))' }}
        >
          <animateMotion
            dur={`${firingMs}ms`}
            begin={`${i * staggerMs}ms`}
            repeatCount="1"
            path={edgePath}
            fill="freeze"
            calcMode="spline"
            keyTimes="0;1"
            keySplines="0.42 0 0.58 1"
          />
        </circle>
      ))}

      {(showBadge || editing) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: editing || badgeInteractive ? 'all' : 'none',
            }}
            className="nodrag nopan"
          >
            {editing ? (
              <WeightEditor
                initial={weight}
                onDone={(value) => {
                  if (value !== null && value !== weight) commitWeight(id, value);
                  setEditingEdgeId(null);
                }}
              />
            ) : (
              <div
                className={clsx(
                  'flex h-5 min-w-5 items-center justify-center rounded-full border bg-elevated px-1.5 text-[11px] font-[650] tabular-nums shadow-sm',
                  selected ? 'border-primary text-primary' : 'border-net-stroke text-fg',
                  weight === 1 && 'opacity-80'
                )}
                title={isPlaying ? `Weight ${weight}` : `Weight ${weight}. Double-click to change it.`}
                onDoubleClick={() => !isPlaying && setEditingEdgeId(id)}
              >
                {weight}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

function WeightEditor({ initial, onDone }: { initial: number; onDone: (value: number | null) => void }) {
  const [value, setValue] = useState(String(initial));
  const finished = useRef(false);

  const finish = (commit: boolean) => {
    if (finished.current) return;
    finished.current = true;
    onDone(commit ? Math.max(1, parseInt(value) || 1) : null);
  };

  return (
    <input
      autoFocus
      type="number"
      min={1}
      value={value}
      aria-label="Arc weight"
      className="input input-sm w-16 text-center shadow"
      onFocus={(e) => e.target.select()}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') finish(true);
        if (e.key === 'Escape') finish(false);
      }}
    />
  );
}
