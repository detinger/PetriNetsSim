import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from '@xyflow/react';

export default function WeightedArc({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected,
  markerEnd,
}: EdgeProps) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    curvature: (data?.curvature as number) ?? 0.75,
  });

  const weight = data?.weight as number;

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: selected ? 4 : 3,
          stroke: selected ? '#88c0d0' : '#2e3440', // Highlight in frost blue when selected
          filter: selected ? 'drop-shadow(0 0 5px rgba(136,192,208,0.5))' : 'none',
          ...style
        }}
      />

      {/* Animated token flow */}
      {data?.isFiring && (
        <circle key={Date.now()} r="5" fill="#ebcb8b" className="shadow-lg">
          <animateMotion
            dur="0.5s"
            repeatCount="1"
            path={edgePath}
            begin="0s"
            fill="freeze"
          />
        </circle>
      )}

      {weight > 1 && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan bg-nord-6 border border-nord-9 text-nord-0 text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-xl border-2"
          >
            {weight}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
