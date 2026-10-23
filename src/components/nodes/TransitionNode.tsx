import { useEffect } from 'react';
import { useReactFlow } from '@xyflow/react';
import { clsx } from 'clsx';
import { NetTransition } from '../../lib/types';
import { useCanvas } from '../CanvasContext';
import { DropZones, NodeLabel, SideHandles, useDropState, useFlash } from './shared';

export default function TransitionNode({
  id,
  data,
  selected,
}: {
  id: string;
  data: NetTransition & { labelOffset?: { x: number; y: number } };
  selected?: boolean;
}) {
  const { updateNodeData } = useReactFlow();
  const { enabledIds, isPlaying, firingTransitionId } = useCanvas();
  const { origin, drop } = useDropState(id, 'place');
  const flashKey = useFlash(id);
  const isEnabled = enabledIds.has(id);
  const isFiring = firingTransitionId === id;

  useEffect(() => {
    updateNodeData(id, {
      shapeType: 'rect',
      shapeWidth: 24,
      shapeHeight: 64,
    });
  }, [id, updateNodeData]);

  return (
    <div className="petri-node" data-drop={drop}>
      <SideHandles />
      <DropZones origin={origin} shape="rect" />

      <div className="flex flex-col items-center justify-center gap-1 relative">
        <div
          className={clsx(
            'petri-shape relative w-6 h-16 rounded-[3px] border-2 transition-[background-color,border-color,opacity] duration-[120ms]',
            isEnabled ? 'bg-accent' : 'bg-net-fill',
            selected ? 'border-primary shadow-focus' : isEnabled ? 'border-accent' : 'border-net-stroke',
            isEnabled && !isFiring && 'petri-transition-enabled'
          )}
          title={isEnabled && !isPlaying ? `${data.name} is enabled. Double-click to fire it.` : undefined}
          role="img"
          aria-label={`Transition ${data.name}, ${isEnabled ? 'enabled' : 'not enabled'}`}
        >
          {/* Ripple burst when transition fires */}
          {isFiring && <span key={`ripple-${firingTransitionId}`} className="petri-ripple" aria-hidden="true" />}
          {flashKey !== null && <span key={flashKey} className="petri-flash rounded-[3px]" aria-hidden="true" />}
        </div>
        <NodeLabel id={id} name={data.name} offset={data.labelOffset} />
      </div>
    </div>
  );
}
