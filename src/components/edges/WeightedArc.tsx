import { useRef, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, useInternalNode } from '@xyflow/react';
import { clsx } from 'clsx';
import { ARC_CURVATURE, arcPath } from '../../lib/arcGeometry';
import { useCanvas } from '../CanvasContext';

export default function WeightedArc({
  id,
  source,
  target,
  sourcePosition,
  targetPosition,
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
    sourcePosition,
    target: targetNode,
    targetPosition,
    curvature: (data?.curvature as number) ?? ARC_CURVATURE,
    parallel: overlappingEdgeIds.has(id),
  });

  const weight = Number(data?.weight) || 1;
  const editing = editingEdgeId === id;
  // Weight 1 is implicit; it shows on hover or selection so it's clear the weight can change
  const showBadge = weight > 1 || selected || hoveredEdgeId === id;
  const badgeInteractive = weight > 1 || selected;

  // The stored markerEnd carries a fixed colour; draw a themed arrowhead instead
  const markerId = `petri-arrow-${id.replace(/[^\w-]/g, '_')}`;

  return (
    <>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="10"
          markerHeight="10"
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path d="M0 1 L10 5 L0 9 Z" className="petri-arc-arrow" />
        </marker>
      </defs>

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={`url(#${markerId})`}
        className="petri-arc"
        style={{ strokeWidth: selected ? 2.5 : 2 }}
      />

      {/* Ends of the selected arc can be dragged to another node */}
      {selected && !isPlaying && (
        <g className="petri-arc-ends" aria-hidden="true">
          <circle cx={start.x} cy={start.y} r={4} />
          <circle cx={end.x} cy={end.y} r={4} />
        </g>
      )}

      {firingEdgeIds.has(id) && (
        <circle key={firingKey} r="5" className="fill-accent stroke-net-fill" strokeWidth={1.5}>
          <animateMotion dur={`${firingMs}ms`} repeatCount="1" path={edgePath} begin="0s" fill="freeze" />
        </circle>
      )}

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
