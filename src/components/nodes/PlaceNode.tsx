import { useEffect, useRef, useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { clsx } from 'clsx';
import { NetPlace } from '../../lib/types';
import { DropZones, NodeLabel, SideHandles, useDropState, useFlash } from './shared';

export default function PlaceNode({ id, data, selected }: { id: string; data: NetPlace & { labelOffset?: { x: number; y: number } }; selected?: boolean }) {
  const tokens = Number(data.tokens) || 0;
  const { updateNodeData } = useReactFlow();
  const { origin, drop } = useDropState(id, 'transition');
  const flashKey = useFlash(id);

  // Track previous token count to trigger pop animation on change
  const prevTokens = useRef(tokens);
  const [popKey, setPopKey] = useState<number | null>(null);
  useEffect(() => {
    if (prevTokens.current !== tokens) {
      prevTokens.current = tokens;
      setPopKey(Date.now());
    }
  }, [tokens]);

  useEffect(() => {
    updateNodeData(id, {
      shapeType: 'circle',
      shapeWidth: 56,
      shapeHeight: 56,
    });
  }, [id, updateNodeData]);

  const renderTokens = () => {
    if (tokens === 0) return null;
    if (tokens >= 5) {
      return (
        <span key={popKey ?? 'n'} className={clsx('text-base font-bold tabular-nums text-net-stroke', popKey != null && 'petri-token-pop')}>
          {tokens}
        </span>
      );
    }

    return (
      <div key={popKey ?? 'n'} className={clsx('flex flex-wrap items-center justify-center gap-1 max-w-[36px] min-h-[14px]', popKey != null && 'petri-token-pop')}>
        {Array.from({ length: tokens }).map((_, i) => (
          <div key={i} className="w-2.5 h-2.5 bg-net-stroke rounded-full shrink-0" />
        ))}
      </div>
    );
  };

  return (
    <div className="petri-node" data-drop={drop}>
      <SideHandles />
      <DropZones origin={origin} shape="circle" />

      <div className="flex flex-col items-center justify-center gap-1">
        <div
          className={clsx(
            'petri-shape relative w-14 h-14 rounded-full border-2 flex items-center justify-center bg-net-fill transition-[border-color,box-shadow,opacity] duration-[120ms]',
            selected ? 'border-primary shadow-focus' : 'border-net-stroke'
          )}
          role="img"
          aria-label={`Place ${data.name}, ${tokens} ${tokens === 1 ? 'token' : 'tokens'}`}
        >
          {renderTokens()}
          {flashKey !== null && <span key={flashKey} className="petri-flash rounded-full" aria-hidden="true" />}
        </div>
        <NodeLabel id={id} name={data.name} offset={data.labelOffset} />
      </div>
    </div>
  );
}
