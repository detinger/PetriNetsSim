import { getBezierPath, InternalNode, Position } from '@xyflow/react';
import { pickSides, Side } from './model';

type Point = { x: number; y: number };
type Endpoint = InternalNode | Point;

export const ARC_CURVATURE = 0.75;
/** Distance between two opposite arcs that would otherwise share both endpoints. */
const PARALLEL_OFFSET = 7;

export const sidePosition: Record<Side, Position> = {
  left: Position.Left,
  right: Position.Right,
  top: Position.Top,
  bottom: Position.Bottom,
};

const isNode = (end: Endpoint): end is InternalNode => 'internals' in end;

function shapeBox(node: InternalNode) {
  const { x, y } = node.internals.positionAbsolute;
  const measuredWidth = node.measured?.width ?? 0;
  const measuredHeight = node.measured?.height ?? 0;
  return {
    center: { x: x + measuredWidth / 2, y: y + measuredHeight / 2 },
    width: (node.data?.shapeWidth as number) ?? measuredWidth,
    height: (node.data?.shapeHeight as number) ?? measuredHeight,
  };
}

export function shapeCenter(node: InternalNode): Point {
  return shapeBox(node).center;
}

/**
 * Point on the shape's outline at the middle of a side, optionally moved along
 * that side by `shift`. Places are circles, so a shifted point follows the curve.
 */
export function sidePoint(node: InternalNode, position: Position, shift = 0): Point {
  const { center, width, height } = shapeBox(node);
  const circle = node.type === 'place';
  const halfW = width / 2;
  const halfH = height / 2;
  const across = (half: number) => (circle ? Math.sqrt(Math.max(half * half - shift * shift, 0)) : half);

  switch (position) {
    case Position.Left:
      return { x: center.x - across(halfW), y: center.y + shift };
    case Position.Right:
      return { x: center.x + across(halfW), y: center.y + shift };
    case Position.Top:
      return { x: center.x + shift, y: center.y - across(halfH) };
    case Position.Bottom:
      return { x: center.x + shift, y: center.y + across(halfH) };
    default:
      return center;
  }
}

/** Sides used when an arc is dropped on a node's body: the ones facing each other. */
export function autoPositions(source: InternalNode, target: InternalNode) {
  const { sourceSide, targetSide } = pickSides(shapeCenter(source), shapeCenter(target));
  return { sourcePosition: sidePosition[sourceSide], targetPosition: sidePosition[targetSide] };
}

// Shift along the side towards the left of travel; opposite arcs get opposite shifts
function parallelShift(position: Position, normal: Point) {
  const alongSide = position === Position.Left || position === Position.Right;
  const component = (alongSide ? normal.y : normal.x) || (alongSide ? normal.x : normal.y);
  return Math.sign(component) * PARALLEL_OFFSET;
}

/** Bezier from shape outline to shape outline (or to a free point while dragging). */
export function arcPath({
  source,
  sourcePosition,
  target,
  targetPosition,
  curvature = ARC_CURVATURE,
  parallel = false,
}: {
  source: Endpoint;
  sourcePosition: Position;
  target: Endpoint;
  targetPosition: Position;
  curvature?: number;
  parallel?: boolean;
}) {
  let start = isNode(source) ? sidePoint(source, sourcePosition) : source;
  let end = isNode(target) ? sidePoint(target, targetPosition) : target;

  if (parallel && isNode(source) && isNode(target)) {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 1;
    const normal = { x: -dy / length, y: dx / length };
    start = sidePoint(source, sourcePosition, parallelShift(sourcePosition, normal));
    end = sidePoint(target, targetPosition, parallelShift(targetPosition, normal));
  }

  const [path, labelX, labelY] = getBezierPath({
    sourceX: start.x,
    sourceY: start.y,
    sourcePosition,
    targetX: end.x,
    targetY: end.y,
    targetPosition,
    curvature,
  });
  return [path, labelX, labelY, start, end] as const;
}
