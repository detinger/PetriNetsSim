import { useState } from 'react';
import { Handle, Position, useReactFlow } from '@xyflow/react';
import { clsx } from 'clsx';
import { NetPlace } from '../../lib/types';

export default function PlaceNode({ id, data, selected }: { id: string; data: NetPlace & { labelOffset?: { x: number; y: number } }; selected?: boolean }) {
  const tokens = data.tokens;
  const { updateNodeData } = useReactFlow();
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const renderTokens = () => {
    if (tokens === 0) return null;
    if (tokens >= 5) {
      return <span className="text-lg font-extrabold text-nord-0">{tokens}</span>;
    }

    return (
      <div className="flex flex-wrap items-center justify-center gap-1 max-w-[36px] min-h-[14px]">
        {Array.from({ length: tokens }).map((_, i) => (
          <div key={i} className="w-2.5 h-2.5 bg-nord-0 rounded-full shadow-sm shrink-0" />
        ))}
      </div>
    );
  };

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
      <Handle type="target" position={Position.Left} id="target-left" className="!w-2 !h-2 !bg-nord-9 !border-none transition-transform hover:scale-150 z-50 shadow-sm" />
      <Handle type="source" position={Position.Left} id="source-left" className="!w-2 !h-2 !bg-nord-9 !border-none transition-transform hover:scale-150 z-50 shadow-sm" />
      {/* Right Bidirectional Handles */}
      <Handle type="target" position={Position.Right} id="target-right" className="!w-2 !h-2 !bg-nord-9 !border-none transition-transform hover:scale-150 z-50 shadow-sm" />
      <Handle type="source" position={Position.Right} id="source-right" className="!w-2 !h-2 !bg-nord-9 !border-none transition-transform hover:scale-150 z-50 shadow-sm" />
      {/* Top Bidirectional Handles */}
      <Handle type="target" position={Position.Top} id="target-top" className="!w-2 !h-2 !bg-nord-9 !border-none transition-transform hover:scale-150 z-50 shadow-sm" />
      <Handle type="source" position={Position.Top} id="source-top" className="!w-2 !h-2 !bg-nord-9 !border-none transition-transform hover:scale-150 z-50 shadow-sm" />
      {/* Bottom Bidirectional Handles */}
      <Handle type="target" position={Position.Bottom} id="target-bottom" className="!w-2 !h-2 !bg-nord-9 !border-none transition-transform hover:scale-150 z-50 shadow-sm" />
      <Handle type="source" position={Position.Bottom} id="source-bottom" className="!w-2 !h-2 !bg-nord-9 !border-none transition-transform hover:scale-150 z-50 shadow-sm" />
      
      <div className="flex flex-col items-center justify-center gap-1">
        <div
          className={clsx(
            'w-14 h-14 rounded-full border-[3px] flex items-center justify-center bg-nord-6 shadow-lg transition-all duration-200 relative overflow-hidden',
            selected ? 'border-nord-10 ring-2 ring-nord-10/50' : 'border-nord-0',
            'hover:border-nord-10 hover:shadow-xl'
          )}
        >
          <div className="absolute inset-0 bg-nord-9/40" />
          <div className="relative z-10">
            {renderTokens()}
          </div>
        </div>
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
