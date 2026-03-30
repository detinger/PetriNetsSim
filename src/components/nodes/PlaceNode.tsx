import { Handle, Position } from '@xyflow/react';
import { clsx } from 'clsx';
import { NetPlace } from '../../lib/types';

export default function PlaceNode({ data, selected }: { data: NetPlace; selected?: boolean }) {
  const tokens = data.tokens;

  const renderTokens = () => {
    if (tokens === 0) return null;
    if (tokens >= 5) {
      return <span className="text-lg font-extrabold text-nord-0">{tokens}</span>;
    }

    // Centering tokens by letting the flex container shrink to content and then centering that container in the circle
    return (
      <div className="flex flex-wrap items-center justify-center gap-1 max-w-[36px] min-h-[14px]">
        {Array.from({ length: tokens }).map((_, i) => (
          <div key={i} className="w-2.5 h-2.5 bg-nord-0 rounded-full shadow-sm shrink-0" />
        ))}
      </div>
    );
  };

  return (
    <>
      {/* Left Bidirectional Handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!w-2 !h-2 !bg-nord-9 !border-none transition-transform hover:scale-150 z-50 shadow-sm"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="source-left"
        className="!w-2 !h-2 !bg-nord-9 !border-none transition-transform hover:scale-150 z-50 shadow-sm"
      />
      {/* Right Bidirectional Handles */}
      <Handle
        type="target"
        position={Position.Right}
        id="target-right"
        className="!w-2 !h-2 !bg-nord-9 !border-none transition-transform hover:scale-150 z-50 shadow-sm"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!w-2 !h-2 !bg-nord-9 !border-none transition-transform hover:scale-150 z-50 shadow-sm"
      />
      {/* 
        We use handles on all 4 sides so users can connect from anywhere.
        Actually, hiding them and just letting React Flow use nearest node handle is better, 
        or we define specific handles.
      */}
      <div className="flex flex-col items-center justify-center gap-1">
        <div
          className={clsx(
            'w-14 h-14 rounded-full border-[3px] flex items-center justify-center bg-nord-6 shadow-lg transition-all duration-200 relative overflow-hidden',
            selected ? 'border-nord-10 ring-2 ring-nord-10/50' : 'border-nord-0',
            'hover:border-nord-10 hover:shadow-xl'
          )}
        >
          <div className="absolute inset-0 bg-nord-9/40" /> {/* Darker blue tint */}
          <div className="relative z-10">
            {renderTokens()}
          </div>
        </div>
        <div className="absolute -bottom-6 whitespace-nowrap text-[10px] font-bold text-nord-0 tracking-wider">
          {data.name}
        </div>
      </div>
    </>
  );
}
