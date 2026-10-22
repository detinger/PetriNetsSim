import { Fragment, useRef, useState } from 'react';
import { Handle, Position, useConnection, useReactFlow } from '@xyflow/react';
import { AUTO_SOURCE_HANDLE, AUTO_TARGET_HANDLE } from '../../lib/model';
import { useCanvas } from '../CanvasContext';

const sides = [Position.Left, Position.Right, Position.Top, Position.Bottom];

/**
 * A target and a source handle on each side. The ids (`target-left`, `source-left`, …)
 * are referenced by every saved model, so they must not change.
 */
export function SideHandles() {
  return (
    <>
      {sides.map((side) => (
        <Fragment key={side}>
          <Handle type="target" position={side} id={`target-${side}`} className="petri-handle" />
          <Handle type="source" position={side} id={`source-${side}`} className="petri-handle" />
        </Fragment>
      ))}
    </>
  );
}

/**
 * Invisible handles covering the whole node. They only take pointer events while a
 * connection is being drawn, so an arc can be dropped anywhere on the node.
 */
export function DropZones({ origin, shape }: { origin: boolean; shape: 'circle' | 'rect' }) {
  const className = `petri-drop-zone petri-drop-zone--${shape}`;
  return (
    <>
      <Handle
        type="target"
        position={Position.Left}
        id={AUTO_TARGET_HANDLE}
        className={className}
        isConnectableStart={false}
        isConnectableEnd={!origin}
      />
      <Handle
        type="source"
        position={Position.Right}
        id={AUTO_SOURCE_HANDLE}
        className={className}
        isConnectableStart={false}
        isConnectableEnd={!origin}
      />
    </>
  );
}

/**
 * Whether this node can receive the arc currently being drawn. Arcs always join a
 * place and a transition, so a node accepts connections from the other kind only.
 */
export function useDropState(id: string, acceptsFrom: 'place' | 'transition') {
  return useConnection((connection) => {
    if (!connection.inProgress) return { origin: false, drop: undefined };
    if (connection.fromNode.id === id) return { origin: true, drop: undefined };
    return { origin: false, drop: connection.fromNode.type === acceptsFrom ? 'valid' : 'invalid' };
  });
}

export function useFlash(id: string) {
  const { flash } = useCanvas();
  return flash && (flash.transitionId === id || flash.placeIds.has(id)) ? flash.key : null;
}

export function NodeLabel({
  id,
  name,
  offset,
}: {
  id: string;
  name: string;
  offset?: { x: number; y: number };
}) {
  const { updateNodeData } = useReactFlow();
  const { isPlaying, recordUndo } = useCanvas();
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const recorded = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    if (isPlaying) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
    recorded.current = false;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    if (!dx && !dy) return;
    if (!recorded.current) {
      recordUndo('Move label', { key: `label:${id}` });
      recorded.current = true;
    }
    const currentOffset = offset || { x: 0, y: 0 };
    updateNodeData(id, {
      labelOffset: { x: currentOffset.x + dx, y: currentOffset.y + dy }
    });
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      className="petri-label absolute -bottom-6 whitespace-nowrap nodrag cursor-move select-none p-1"
      style={{ transform: `translate(${offset?.x || 0}px, ${offset?.y || 0}px)` }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {name}
    </div>
  );
}
