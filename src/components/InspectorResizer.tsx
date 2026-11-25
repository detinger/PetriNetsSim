import { CSSProperties, KeyboardEvent, PointerEvent, RefObject, useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'petrinets-inspector-width';
export const MIN_INSPECTOR_WIDTH = 280;
/** Room the canvas always keeps beside the inspector. */
const MIN_CANVAS_WIDTH = 360;
const KEY_STEP = 16;
const KEY_STEP_LARGE = 64;

const maxWidth = () => Math.max(MIN_INSPECTOR_WIDTH, window.innerWidth - MIN_CANVAS_WIDTH);
const clampWidth = (w: number) => Math.round(Math.min(maxWidth(), Math.max(MIN_INSPECTOR_WIDTH, w)));

function readWidth(): number | null {
  try {
    const stored = Number(localStorage.getItem(STORAGE_KEY));
    return Number.isFinite(stored) && stored >= MIN_INSPECTOR_WIDTH ? stored : null;
  } catch {
    return null;
  }
}

/**
 * Inspector width chosen by the user, or null for the stylesheet default.
 * The returned style clamps it to the window so the canvas never disappears.
 */
export function useInspectorWidth() {
  const [width, setWidthState] = useState<number | null>(readWidth);

  const setWidth = useCallback((next: number | null) => {
    setWidthState(next);
    try {
      if (next === null) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // Storage can be unavailable (private mode, blocked site data)
    }
  }, []);

  const style =
    width === null
      ? undefined
      : ({
          '--inspector-width': `clamp(${MIN_INSPECTOR_WIDTH}px, ${width}px, max(${MIN_INSPECTOR_WIDTH}px, calc(100vw - ${MIN_CANVAS_WIDTH}px)))`,
        } as CSSProperties);

  return { width, setWidth, style };
}

/**
 * Drag handle on the inspector's left edge. Drag to resize, double-click to toggle
 * a wide inspector, or focus it and use the arrow keys (Home/End for min/max).
 */
export default function InspectorResizer({
  panelRef,
  setWidth,
}: {
  panelRef: RefObject<HTMLElement | null>;
  setWidth: (width: number | null) => void;
}) {
  const [dragging, setDragging] = useState(false);
  const [current, setCurrent] = useState<number | null>(null);

  const measure = () => panelRef.current?.getBoundingClientRect().width ?? MIN_INSPECTOR_WIDTH;

  // Keep the aria value in sync with the panel's real width (it changes with the window too)
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const observer = new ResizeObserver(() => setCurrent(Math.round(panel.getBoundingClientRect().width)));
    observer.observe(panel);
    return () => observer.disconnect();
  }, [panelRef]);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging || !panelRef.current) return;
    const right = panelRef.current.getBoundingClientRect().right;
    setWidth(clampWidth(right - e.clientX));
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
  };

  const onDoubleClick = () => {
    const wide = clampWidth(window.innerWidth * 0.5);
    // Toggle between a wide inspector and the default width
    setWidth(measure() < wide - 8 ? wide : null);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? KEY_STEP_LARGE : KEY_STEP;
    let next: number | null;
    switch (e.key) {
      case 'ArrowLeft':
        next = clampWidth(measure() + step);
        break;
      case 'ArrowRight':
        next = clampWidth(measure() - step);
        break;
      case 'Home':
        next = MIN_INSPECTOR_WIDTH;
        break;
      case 'End':
        next = maxWidth();
        break;
      case 'Enter':
        onDoubleClick();
        e.preventDefault();
        return;
      default:
        return;
    }
    e.preventDefault();
    setWidth(next);
  };

  useEffect(() => {
    document.body.classList.toggle('is-resizing-inspector', dragging);
    return () => document.body.classList.remove('is-resizing-inspector');
  }, [dragging]);

  return (
    <div
      className="inspector-resizer"
      role="separator"
      aria-orientation="vertical"
      aria-label="Resize inspector"
      aria-valuemin={MIN_INSPECTOR_WIDTH}
      aria-valuemax={typeof window === 'undefined' ? undefined : maxWidth()}
      aria-valuenow={current ?? undefined}
      title="Drag to resize · double-click to widen or restore"
      tabIndex={0}
      data-dragging={dragging || undefined}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDoubleClick={onDoubleClick}
      onKeyDown={onKeyDown}
    />
  );
}
