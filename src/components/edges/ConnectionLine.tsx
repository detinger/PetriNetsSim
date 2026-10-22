import { ConnectionLineComponentProps, Position } from '@xyflow/react';
import { clsx } from 'clsx';
import { arcPath, autoPositions } from '../../lib/arcGeometry';
import { isAutoHandle } from '../../lib/model';

/**
 * Preview drawn while connecting. It uses the same geometry as a finished arc,
 * snaps to the sides the arc will use once the pointer is over a valid node,
 * and turns red over a node that can't be connected.
 */
export default function ConnectionLine({
  fromNode,
  fromHandle,
  fromPosition,
  toNode,
  toHandle,
  toX,
  toY,
  toPosition,
  connectionStatus,
}: ConnectionLineComponentProps) {
  // Dragging the source end of an existing arc starts from its (fixed) target
  const reversed = fromHandle.type === 'target';
  let path: string;

  if (connectionStatus === 'valid' && toNode && toHandle) {
    const source = reversed ? toNode : fromNode;
    const target = reversed ? fromNode : toNode;
    let sourcePosition: Position;
    let targetPosition: Position;
    if (isAutoHandle(toHandle.id)) {
      ({ sourcePosition, targetPosition } = autoPositions(source, target));
    } else {
      sourcePosition = reversed ? toHandle.position : fromPosition;
      targetPosition = reversed ? fromPosition : toHandle.position;
    }
    [path] = arcPath({ source, sourcePosition, target, targetPosition });
  } else {
    const pointer = { x: toX, y: toY };
    [path] = reversed
      ? arcPath({ source: pointer, sourcePosition: toPosition, target: fromNode, targetPosition: fromPosition })
      : arcPath({ source: fromNode, sourcePosition: fromPosition, target: pointer, targetPosition: toPosition });
  }

  return (
    <g
      className={clsx(
        'petri-connection',
        connectionStatus === 'valid' && 'petri-connection--valid',
        connectionStatus === 'invalid' && 'petri-connection--invalid'
      )}
    >
      <defs>
        <marker
          id="petri-connection-arrow"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="10"
          markerHeight="10"
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path d="M0 1 L10 5 L0 9 Z" className="petri-connection-arrow" />
        </marker>
      </defs>
      <path d={path} fill="none" className="petri-connection-path" markerEnd="url(#petri-connection-arrow)" />
    </g>
  );
}
