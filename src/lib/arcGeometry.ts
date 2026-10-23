import { InternalNode } from '@xyflow/react';

type Point = { x: number; y: number };
type Endpoint = InternalNode | Point;

/** Perpendicular separation between two opposite arcs sharing the same node pair. */
const PARALLEL_OFFSET = 8;
/** Extra bow of the quadratic bezier on parallel arcs (pixels). */
export const PARALLEL_BOW = 10;
/** Arrow marker length in canvas pixels — path is shortened so the marker tip lands on the outline. */
const MARKER_LEN = 10;

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

function normalize(dx: number, dy: number): Point {
  const len = Math.hypot(dx, dy) || 1;
  return { x: dx / len, y: dy / len };
}

/** Point on the node's shape outline in direction `dir` from the center. */
function outlinePoint(node: InternalNode, dir: Point): Point {
  const { center, width, height } = shapeBox(node);
  if (node.type === 'place') {
    const r = width / 2;
    return { x: center.x + r * dir.x, y: center.y + r * dir.y };
  }
  // Rectangle: ray-AABB intersection — find smallest t so center + t*dir hits a wall
  const hw = width / 2;
  const hh = height / 2;
  const tx = dir.x !== 0 ? hw / Math.abs(dir.x) : Infinity;
  const ty = dir.y !== 0 ? hh / Math.abs(dir.y) : Infinity;
  const t = Math.min(tx, ty);
  return { x: center.x + t * dir.x, y: center.y + t * dir.y };
}

function centerOf(end: Endpoint): Point {
  return isNode(end) ? shapeBox(end).center : end;
}

function endpointAt(end: Endpoint, dir: Point): Point {
  return isNode(end) ? outlinePoint(end, dir) : end;
}

/** Straight line, user-curved arc, or gentle bow for parallel pairs — from shape outline to shape outline. */
export function arcPath({
  source,
  target,
  parallel = false,
  curvature = 0,
}: {
  source: Endpoint;
  target: Endpoint;
  parallel?: boolean;
  curvature?: number;
}) {
  const sc = centerOf(source);
  const tc = centerOf(target);
  const dir = normalize(tc.x - sc.x, tc.y - sc.y);
  const rev = { x: -dir.x, y: -dir.y };

  const perp = { x: -dir.y, y: dir.x };

  if (parallel) {
    // Raw offset from the cardinal outline point — may land off the shape surface.
    // Project back onto the actual outline so arcs always touch their shapes.
    const rawS = endpointAt(source, dir);
    const rawE = endpointAt(target, rev);
    const rawStart = { x: rawS.x + perp.x * PARALLEL_OFFSET, y: rawS.y + perp.y * PARALLEL_OFFSET };
    const rawEnd   = { x: rawE.x + perp.x * PARALLEL_OFFSET, y: rawE.y + perp.y * PARALLEL_OFFSET };
    const start = isNode(source)
      ? outlinePoint(source, normalize(rawStart.x - sc.x, rawStart.y - sc.y))
      : rawStart;
    const end = isNode(target)
      ? outlinePoint(target, normalize(rawEnd.x - tc.x, rawEnd.y - tc.y))
      : rawEnd;
    const bow = PARALLEL_BOW + curvature;
    const mx = (start.x + end.x) / 2 + perp.x * bow;
    const my = (start.y + end.y) / 2 + perp.y * bow;
    // Shorten the path end along the bezier's end tangent so marker tip (refX=0) lands on `end`
    const et = normalize(end.x - mx, end.y - my);
    const pathEnd = { x: end.x - MARKER_LEN * et.x, y: end.y - MARKER_LEN * et.y };
    const labelX = (start.x + 2 * mx + end.x) / 4;
    const labelY = (start.y + 2 * my + end.y) / 4;
    return [`M ${start.x} ${start.y} Q ${mx} ${my} ${pathEnd.x} ${pathEnd.y}`, labelX, labelY, start, end] as const;
  }

  const start = endpointAt(source, dir);
  const end   = endpointAt(target, rev);

  if (curvature !== 0) {
    const mx = (start.x + end.x) / 2 + perp.x * curvature;
    const my = (start.y + end.y) / 2 + perp.y * curvature;
    const et = normalize(end.x - mx, end.y - my);
    const pathEnd = { x: end.x - MARKER_LEN * et.x, y: end.y - MARKER_LEN * et.y };
    const labelX = (start.x + 2 * mx + end.x) / 4;
    const labelY = (start.y + 2 * my + end.y) / 4;
    return [`M ${start.x} ${start.y} Q ${mx} ${my} ${pathEnd.x} ${pathEnd.y}`, labelX, labelY, start, end] as const;
  }

  // Shorten the line so the marker tip (refX=0) lands exactly on `end`
  const pathEndX = end.x - MARKER_LEN * dir.x;
  const pathEndY = end.y - MARKER_LEN * dir.y;
  const labelX = (start.x + end.x) / 2;
  const labelY = (start.y + end.y) / 2;
  return [`M ${start.x} ${start.y} L ${pathEndX} ${pathEndY}`, labelX, labelY, start, end] as const;
}
