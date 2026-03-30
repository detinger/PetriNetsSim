import {
  BaseEdge,
  EdgeLabelRenderer,
  EdgeProps,
  getBezierPath,
  Position,
  useInternalNode,
} from '@xyflow/react';

function getCenter(node: any) {
  const x = node.internals.positionAbsolute.x;
  const y = node.internals.positionAbsolute.y;
  const width = node.measured?.width ?? 0;
  const height = node.measured?.height ?? 0;

  return {
    x: x + width / 2,
    y: y + height / 2,
  };
}

function getShapeSize(node: any) {
  const shapeWidth = node.data?.shapeWidth ?? node.measured?.width ?? 0;
  const shapeHeight = node.data?.shapeHeight ?? node.measured?.height ?? 0;

  return {
    width: shapeWidth,
    height: shapeHeight,
  };
}

function getSidePoint(node: any, position: Position | undefined) {
  const center = getCenter(node);
  const { width, height } = getShapeSize(node);

  const halfW = width / 2;
  const halfH = height / 2;

  switch (position) {
    case Position.Left:
      return { x: center.x - halfW, y: center.y };
    case Position.Right:
      return { x: center.x + halfW, y: center.y };
    case Position.Top:
      return { x: center.x, y: center.y - halfH };
    case Position.Bottom:
      return { x: center.x, y: center.y + halfH };
    default:
      return center;
  }
}

export default function WeightedArc({
  id,
  source,
  target,
  sourcePosition,
  targetPosition,
  style = {},
  data,
  selected,
  markerEnd,
}: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);

  if (!sourceNode || !targetNode) return null;

  const sourcePoint = getSidePoint(sourceNode, sourcePosition);
  const targetPoint = getSidePoint(targetNode, targetPosition);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sourcePoint.x,
    sourceY: sourcePoint.y,
    sourcePosition,
    targetX: targetPoint.x,
    targetY: targetPoint.y,
    targetPosition,
    curvature: (data?.curvature as number) ?? 0.75,
  });

  const weight = data?.weight as number;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          strokeWidth: selected ? 4 : 3,
          stroke: selected ? '#88c0d0' : '#2e3440',
          filter: selected
            ? 'drop-shadow(0 0 5px rgba(136,192,208,0.5))'
            : 'none',
          ...style,
        }}
      />

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