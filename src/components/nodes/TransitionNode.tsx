import { Handle, Position } from '@xyflow/react';
import { clsx } from 'clsx';
import { NetTransition } from '../../lib/types';

export default function TransitionNode({
  data,
  selected,
}: {
  data: NetTransition & { isEnabled?: boolean };
  selected?: boolean
}) {
  return (
    <>
      {/* Left Bidirectional Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!w-2 !h-2 !bg-nord-14 !border-none transition-transform hover:scale-150 z-50 shadow-sm"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="source-left"
        className="!w-2 !h-2 !bg-nord-14 !border-none transition-transform hover:scale-150 z-50 shadow-sm"
      />
      {/* Right Bidirectional Handles */}
      <Handle
        type="target"
        position={Position.Right}
        id="target-right"
        className="!w-2 !h-2 !bg-nord-14 !border-none transition-transform hover:scale-150 z-50 shadow-sm"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!w-2 !h-2 !bg-nord-14 !border-none transition-transform hover:scale-150 z-50 shadow-sm"
      />
      <div className="flex flex-col items-center justify-center gap-1 relative">
        <div
          className={clsx(
            'w-6 h-16 rounded-sm border-[3px] shadow-xl transition-all duration-200',
            data.isEnabled ? 'bg-nord-14 border-nord-14 ring-4 ring-nord-14/20 animate-pulse' : 'bg-nord-2 border-nord-0',
            selected ? 'ring-2 ring-nord-10' : '',
            'hover:brightness-125'
          )}
        />
        <div className="absolute -bottom-6 whitespace-nowrap text-[10px] font-bold text-nord-0 tracking-wider">
          {data.name}
        </div>
      </div>
    </>
  );
}
