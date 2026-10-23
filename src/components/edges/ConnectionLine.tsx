import { ConnectionLineComponentProps } from '@xyflow/react';
import { clsx } from 'clsx';
import { arcPath } from '../../lib/arcGeometry';

/**
 * Preview drawn while connecting. It uses the same geometry as a finished arc,
 * snaps to the sides the arc will use once the pointer is over a valid node,
 * and turns red over a node that can't be connected.
 */
export default function ConnectionLine({
  fromNode,
  fromHandle,
  toNode,
  toHandle,
  toX,
  toY,
  connectionStatus,
}: ConnectionLineComponentProps) {
  // Dragging the source end of an existing arc starts from its (fixed) target
  const reversed = fromHandle.type === 'target';
  let path: string;

  if (connectionStatus === 'valid' && toNode && toHandle) {
    const source = reversed ? toNode : fromNode;
    const target = reversed ? fromNode : toNode;
    [path] = arcPath({ source, target });
  } else {
    const pointer = { x: toX, y: toY };
    [path] = reversed
      ? arcPath({ source: pointer, target: fromNode })
      : arcPath({ source: fromNode, target: pointer });
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
          refX="0"
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
