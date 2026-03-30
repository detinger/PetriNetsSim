import { useEffect, useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { clsx } from 'clsx';
import { NetTransition } from '../../lib/types';

export default function TransitionNode({
  id,
  data,
  selected,
}: {
  id: string;
  data: NetTransition & { isEnabled?: boolean; labelOffset?: { x: number; y: number } };
  selected?: boolean;
}) {
  const { updateNodeData } = useReactFlow();

  useEffect(() => {
    updateNodeData(id, {
      shapeType: 'rect',
      shapeWidth: 24,
      shapeHeight: 64,
    });
  }, [id, updateNodeData]);


  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - startPos.x;
    const dy = e.clientY - startPos.y;
    const currentOffset = data.labelOffset || { x: 0, y: 0 };
    updateNodeData(id, {
      labelOffset: { x: currentOffset.x + dx, y: currentOffset.y + dy }
    });
    setStartPos({ x: e.clientX, y: e.clientY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return (
    <>
      {/* Left Bidirectional Handles */}
      <Handle type="target" position={Position.Left} id="target-left" className="!w-2 !h-2 !bg-nord-14 !border-none transition-transform hover:scale-150 z-50 shadow-sm" />
      <Handle type="source" position={Position.Left} id="source-left" className="!w-2 !h-2 !bg-nord-14 !border-none transition-transform hover:scale-150 z-50 shadow-sm" />
      {/* Right Bidirectional Handles */}
      <Handle type="target" position={Position.Right} id="target-right" className="!w-2 !h-2 !bg-nord-14 !border-none transition-transform hover:scale-150 z-50 shadow-sm" />
      <Handle type="source" position={Position.Right} id="source-right" className="!w-2 !h-2 !bg-nord-14 !border-none transition-transform hover:scale-150 z-50 shadow-sm" />
      {/* Top Bidirectional Handles */}
      <Handle type="target" position={Position.Top} id="target-top" className="!w-2 !h-2 !bg-nord-14 !border-none transition-transform hover:scale-150 z-50 shadow-sm" />
      <Handle type="source" position={Position.Top} id="source-top" className="!w-2 !h-2 !bg-nord-14 !border-none transition-transform hover:scale-150 z-50 shadow-sm" />
      {/* Bottom Bidirectional Handles */}
      <Handle type="target" position={Position.Bottom} id="target-bottom" className="!w-2 !h-2 !bg-nord-14 !border-none transition-transform hover:scale-150 z-50 shadow-sm" />
      <Handle type="source" position={Position.Bottom} id="source-bottom" className="!w-2 !h-2 !bg-nord-14 !border-none transition-transform hover:scale-150 z-50 shadow-sm" />

      <div className="flex flex-col items-center justify-center gap-1 relative">
        <div
          className={clsx(
            'w-6 h-16 rounded-sm border-[3px] shadow-xl transition-all duration-200',
            data.isEnabled ? 'bg-nord-14 border-nord-14 animate-pulse' : 'bg-nord-2 border-nord-0',
            selected ? '' : '',
            'hover:brightness-125'
          )}
        />
        <div
          className="absolute -bottom-6 whitespace-nowrap text-[10px] font-bold text-nord-0 tracking-wider nodrag cursor-move select-none p-1"
          style={{ transform: `translate(${data.labelOffset?.x || 0}px, ${data.labelOffset?.y || 0}px)` }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {data.name}
        </div>
      </div>
    </>
  );
}
