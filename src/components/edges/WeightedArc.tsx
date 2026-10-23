import { useCallback, useEffect, useRef, useState } from 'react';
import { BaseEdge, EdgeLabelRenderer, EdgeProps, useInternalNode, useReactFlow } from '@xyflow/react';
import { clsx } from 'clsx';
import { arcPath, PARALLEL_BOW } from '../../lib/arcGeometry';
import { useCanvas } from '../CanvasContext';

export default function WeightedArc({
  id,
  source,
  target,
  data,
  selected,
}: EdgeProps) {
  const sourceNode = useInternalNode(source);
  const targetNode = useInternalNode(target);
  const {
    isPlaying,
    firingEdgeIds,
    firingKey,
    firingMs,
    overlappingEdgeIds,
    hoveredEdgeId,
    editingEdgeId,
    setEditingEdgeId,
    commitWeight,
    commitCurvature,
  } = useCanvas();
  const { screenToFlowPosition } = useReactFlow();

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [draftCurvature, setDraftCurvature] = useState<number | null>(null);

  // Close context menu on outside click
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener('pointerdown', close);
    return () => window.removeEventListener('pointerdown', close);
  }, [contextMenu]);

  if (!sourceNode || !targetNode) return null;

  const storedCurvature = Number(data?.curvature) || 0;
  const curvature = draftCurvature ?? storedCurvature;
  const parallel = overlappingEdgeIds.has(id);

  const [edgePath, labelX, labelY, start, end] = arcPath({
    source: sourceNode,
    target: targetNode,
    parallel,
    curvature,
  });

  // Perpendicular direction and midpoint — used for drag-to-curve
  const arcDx = end.x - start.x;
  const arcDy = end.y - start.y;
  const arcLen = Math.hypot(arcDx, arcDy) || 1;
  const perpX = -arcDy / arcLen;
  const perpY = arcDx / arcLen;
  const midX = (start.x + end.x) / 2;
  const midY = (start.y + end.y) / 2;

  // Control-point position (where the drag handle sits when arc is curved)
  const bow = (parallel ? PARALLEL_BOW : 0) + curvature;
  const cpX = midX + perpX * bow;
  const cpY = midY + perpY * bow;

  const weight = Number(data?.weight) || 1;
  const editing = editingEdgeId === id;
  const showBadge = weight > 1 || selected || hoveredEdgeId === id;
  const badgeInteractive = weight > 1 || selected;
  const isFiring = firingEdgeIds.has(id);
  const isCurved = curvature !== 0;

  const markerId = `petri-arrow-${id.replace(/[^\w-]/g, '_')}`;
  const motionPathId = `petri-motion-path-${id.replace(/[^\w-]/g, '_')}`;

  const tokenCount = Math.min(weight, 4);
  const staggerMs = 80;

  // Shared drag logic — called by both the arc hit-zone and the control-point handle
  const startCurveDrag = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    // Snapshot geometry at drag start (stable while nodes aren't moving)
    const snapMidX = midX;
    const snapMidY = midY;
    const snapPerpX = perpX;
    const snapPerpY = perpY;
    const snapParallel = parallel;

    const getCurvature = (clientX: number, clientY: number) => {
      const fp = screenToFlowPosition({ x: clientX, y: clientY });
      const newBow = (fp.x - snapMidX) * snapPerpX + (fp.y - snapMidY) * snapPerpY;
      return newBow - (snapParallel ? PARALLEL_BOW : 0);
    };

    const onMove = (me: MouseEvent) => setDraftCurvature(getCurvature(me.clientX, me.clientY));
    const onUp = (me: MouseEvent) => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      commitCurvature(id, getCurvature(me.clientX, me.clientY));
      setDraftCurvature(null);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [id, midX, midY, perpX, perpY, parallel, screenToFlowPosition, commitCurvature]);

  return (
    <>
      <defs>
        <marker
          id={markerId}
          viewBox="0 0 10 10"
          refX="0"
          refY="5"
          markerWidth="10"
          markerHeight="10"
          markerUnits="userSpaceOnUse"
          orient="auto"
        >
          <path d="M0 1 L10 5 L0 9 Z" className={clsx('petri-arc-arrow', isFiring && 'petri-arc-firing-arrow')} />
        </marker>
        <path id={motionPathId} d={edgePath} fill="none" stroke="none" />
      </defs>

      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={`url(#${markerId})`}
        className={clsx('petri-arc', isFiring && 'petri-arc-firing')}
        style={{ strokeWidth: selected ? 2.5 : 2 }}
      />

      {/* Transparent wide hit zone for drag-to-curve and right-click */}
      {!isPlaying && (
        <path
          d={edgePath}
          stroke="transparent"
          strokeWidth={16}
          fill="none"
          style={{ cursor: 'crosshair' }}
          onMouseDown={startCurveDrag}
          onContextMenu={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const fp = screenToFlowPosition({ x: e.clientX, y: e.clientY });
            setContextMenu(fp);
          }}
        />
      )}

      {selected && !isPlaying && (
        <g className="petri-arc-ends" aria-hidden="true">
          <circle cx={start.x} cy={start.y} r={4} />
          <circle cx={end.x} cy={end.y} r={4} />
        </g>
      )}

      {/* Control-point drag handle — visible when arc is curved and selected */}
      {isCurved && selected && !isPlaying && (
        <circle
          cx={cpX}
          cy={cpY}
          r={5}
          className="fill-primary stroke-net-fill"
          strokeWidth={1.5}
          style={{ cursor: 'grab' }}
          onMouseDown={startCurveDrag}
        />
      )}

      {isFiring && Array.from({ length: tokenCount }).map((_, i) => (
        <MovingToken
          key={`${firingKey}-${i}`}
          pathId={motionPathId}
          r={i === 0 ? 10 : 7}
          dur={firingMs}
          delay={i * staggerMs}
        />
      ))}

      {/* Context menu (right-click) */}
      {contextMenu && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(4px, -50%) translate(${contextMenu.x}px, ${contextMenu.y}px)`,
              zIndex: 100,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="bg-elevated border border-line rounded shadow-lg py-1 min-w-[130px]">
              {isCurved ? (
                <button
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-hovered"
                  onClick={() => { commitCurvature(id, 0); setContextMenu(null); }}
                >
                  Straighten arc
                </button>
              ) : (
                <button
                  className="w-full px-3 py-1.5 text-left text-sm hover:bg-hovered"
                  onClick={() => { commitCurvature(id, 60); setContextMenu(null); }}
                >
                  Make curved
                </button>
              )}
            </div>
          </div>
        </EdgeLabelRenderer>
      )}

      {(showBadge || editing) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: editing || badgeInteractive ? 'all' : 'none',
            }}
            className="nodrag nopan"
          >
            {editing ? (
              <WeightEditor
                initial={weight}
                onDone={(value) => {
                  if (value !== null && value !== weight) commitWeight(id, value);
                  setEditingEdgeId(null);
                }}
              />
            ) : (
              <div
                className={clsx(
                  'flex h-5 min-w-5 items-center justify-center rounded-full border bg-elevated px-1.5 text-[11px] font-[650] tabular-nums shadow-sm',
                  selected ? 'border-primary text-primary' : 'border-net-stroke text-fg',
                  weight === 1 && 'opacity-80'
                )}
                title={isPlaying ? `Weight ${weight}` : `Weight ${weight}. Double-click to change it.`}
                onDoubleClick={() => !isPlaying && setEditingEdgeId(id)}
              >
                {weight}
              </div>
            )}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

function MovingToken({ pathId, r, dur, delay }: { pathId: string; r: number; dur: number; delay: number }) {
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    const path = document.getElementById(pathId) as SVGPathElement | null;
    if (!path) return;

    const totalLength = path.getTotalLength();
    let startTs: number | null = null;
    let raf: number;

    const tick = (ts: number) => {
      if (startTs === null) startTs = ts;
      const elapsed = ts - startTs - delay;
      const circle = circleRef.current;
      if (!circle) return;

      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const t = Math.min(elapsed / dur, 1);
      const pt = path.getPointAtLength(t * totalLength);
      circle.setAttribute('cx', String(pt.x));
      circle.setAttribute('cy', String(pt.y));
      circle.setAttribute('visibility', 'visible');

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [pathId, dur, delay]);

  return (
    <circle
      ref={circleRef}
      r={r}
      visibility="hidden"
      className="fill-accent stroke-net-fill"
      strokeWidth={1.5}
      style={{ filter: 'drop-shadow(0 0 4px color-mix(in srgb, var(--accent) 90%, transparent))' }}
    />
  );
}

function WeightEditor({ initial, onDone }: { initial: number; onDone: (value: number | null) => void }) {
  const [value, setValue] = useState(String(initial));
  const finished = useRef(false);

  const finish = (commit: boolean) => {
    if (finished.current) return;
    finished.current = true;
    onDone(commit ? Math.max(1, parseInt(value) || 1) : null);
  };

  return (
    <input
      autoFocus
      type="number"
      min={1}
      value={value}
      aria-label="Arc weight"
      className="input input-sm w-16 text-center shadow"
      onFocus={(e) => e.target.select()}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => finish(true)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') finish(true);
        if (e.key === 'Escape') finish(false);
      }}
    />
  );
}
