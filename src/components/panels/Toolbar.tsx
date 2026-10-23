import { Circle, Square, Play, Pause, StepForward, StepBack, RotateCcw, Trash2, Sparkles, PanelRight, Undo2, Redo2, Keyboard } from 'lucide-react';
import { Tooltip } from '../ui';
import { MOD_KEY } from '../../lib/shortcuts';

// Slider uses a two-segment logarithmic scale so 1× lands exactly at the midpoint (50):
//   pos  0 → 0.1×   pos 25 → 0.316×   pos 50 → 1×   pos 75 → 2×   pos 100 → 4×
// Left half  (0–50):  mult = 0.1 × 10^(pos/50)
// Right half (50–100): mult = 1 × 4^((pos−50)/50)
// Speed in ms = 800 / multiplier

const SLIDER_MIN = 0;
const SLIDER_MAX = 100;

function sliderToMs(pos: number): number {
  const mult = pos <= 50
    ? 0.1 * Math.pow(10, pos / 50)
    : Math.pow(4, (pos - 50) / 50);
  return Math.round(800 / mult);
}

function msToSlider(ms: number): number {
  const mult = 800 / ms;
  if (mult <= 1) return (Math.log10(mult / 0.1) / Math.log10(10)) * 50;
  return 50 + (Math.log(mult) / Math.log(4)) * 50;
}

function speedLabel(ms: number): string {
  const x = 800 / ms;
  if (x >= 10) return `${Math.round(x)}×`;
  if (x >= 1) return `${x.toFixed(1).replace(/\.0$/, '')}×`;
  return `${x.toFixed(2).replace(/0$/, '')}×`;
}

export default function Toolbar({
  addPlace,
  addTransition,
  onPlay,
  onStep,
  onStepBack,
  onReset,
  onClear,
  onUndo,
  onRedo,
  undoLabel,
  redoLabel,
  speed,
  onSpeedChange,
  showAnimations,
  onToggleAnimations,
  showInspector,
  onToggleInspector,
  onShowShortcuts,
  isPlaying,
  isAnimating,
  deadlock,
  historyCount,
  isEmpty,
}: {
  addPlace: () => void;
  addTransition: () => void;
  onPlay: () => void;
  onStep: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  undoLabel: string | null;
  redoLabel: string | null;
  speed: number;
  onSpeedChange: (ms: number) => void;
  showAnimations: boolean;
  onToggleAnimations: () => void;
  showInspector: boolean;
  onToggleInspector: () => void;
  onShowShortcuts: () => void;
  isPlaying: boolean;
  isAnimating: boolean;
  deadlock: boolean;
  historyCount: number;
  isEmpty: boolean;
}) {
  const editLocked = isPlaying ? 'Pause the simulation to edit' : null;

  const sliderValue = Math.round(msToSlider(speed));

  return (
    <div className="toolbar" role="toolbar" aria-label="Model and simulation">
      <div className="toolbar-group" role="group" aria-label="History">
        <Tooltip label={editLocked ?? (undoLabel ? `Undo ${undoLabel.toLowerCase()}` : 'Nothing to undo')} shortcut={`${MOD_KEY}+Z`} align="start">
          <button type="button" className="btn btn-icon" onClick={onUndo} disabled={!undoLabel || isPlaying || isAnimating} aria-label="Undo" aria-keyshortcuts="Control+Z Meta+Z">
            <Undo2 />
          </button>
        </Tooltip>
        <Tooltip label={editLocked ?? (redoLabel ? `Redo ${redoLabel.toLowerCase()}` : 'Nothing to redo')} shortcut={`${MOD_KEY}+Shift+Z`}>
          <button type="button" className="btn btn-icon" onClick={onRedo} disabled={!redoLabel || isPlaying || isAnimating} aria-label="Redo" aria-keyshortcuts="Control+Shift+Z Meta+Shift+Z">
            <Redo2 />
          </button>
        </Tooltip>
      </div>

      <span className="toolbar-divider" aria-hidden="true" />

      <div className="toolbar-group" role="group" aria-label="Add elements">
        <Tooltip label={editLocked ?? 'Add a place in view'} shortcut="P">
          <button type="button" className="btn" onClick={addPlace} disabled={isPlaying} aria-keyshortcuts="P">
            <Circle />
            <span className="btn-label">Add place</span>
          </button>
        </Tooltip>
        <Tooltip label={editLocked ?? 'Add a transition in view'} shortcut="T">
          <button type="button" className="btn" onClick={addTransition} disabled={isPlaying} aria-keyshortcuts="T">
            <Square />
            <span className="btn-label">Add transition</span>
          </button>
        </Tooltip>
      </div>

      <span className="toolbar-divider" aria-hidden="true" />

      <div className="toolbar-group" role="group" aria-label="Simulation">
        <Tooltip
          label={deadlock ? 'No transition is enabled' : isPlaying ? 'Pause the simulation' : 'Fire enabled transitions automatically'}
          shortcut="Shift+Space"
        >
          <button
            type="button"
            className={isPlaying ? 'btn btn-accent' : 'btn btn-primary'}
            onClick={onPlay}
            disabled={deadlock && !isPlaying}
            aria-keyshortcuts="Shift+Space"
          >
            {isPlaying ? <Pause /> : <Play />}
            {isPlaying ? 'Pause' : 'Run simulation'}
          </button>
        </Tooltip>
        <Tooltip label="Undo the last firing" shortcut="B">
          <button
            type="button"
            className="btn btn-icon"
            onClick={onStepBack}
            disabled={isPlaying || historyCount === 0}
            aria-label="Step back"
            aria-keyshortcuts="B"
          >
            <StepBack />
          </button>
        </Tooltip>
        <Tooltip label={deadlock ? 'No transition is enabled' : 'Fire one enabled transition'} shortcut="Space">
          <button
            type="button"
            className="btn"
            onClick={onStep}
            disabled={isPlaying || deadlock || isAnimating}
            aria-keyshortcuts="Space"
          >
            <StepForward />
            <span className="btn-label">Step</span>
          </button>
        </Tooltip>
        <Tooltip label="Return to the initial marking" shortcut="R">
          <button type="button" className="btn" onClick={onReset} aria-keyshortcuts="R">
            <RotateCcw />
            <span className="btn-label">Reset</span>
          </button>
        </Tooltip>

        {/* Speed slider: drag right for faster, left for slower */}
        <div className="flex items-center gap-2" title={`Speed: ${speedLabel(speed)}`}>
          <span className="text-[11px] font-semibold text-muted w-6 text-right tabular-nums select-none">{speedLabel(speed)}</span>
          <input
            type="range"
            className="speed-slider"
            min={SLIDER_MIN}
            max={SLIDER_MAX}
            step={1}
            value={sliderValue}
            aria-label="Simulation speed"
            onChange={(e) => {
              let pos = Number(e.target.value);
              // Snap to 1× (pos=50) within ±3 units
              if (Math.abs(pos - 50) <= 3) pos = 50;
              onSpeedChange(sliderToMs(pos));
            }}
          />
        </div>
      </div>

      <span className="toolbar-divider" aria-hidden="true" />

      <Tooltip label="Show tokens travelling along arcs when a transition fires">
        <button
          type="button"
          className="btn"
          aria-pressed={showAnimations}
          onClick={onToggleAnimations}
          aria-label="Animate tokens"
        >
          <Sparkles />
          <span className="btn-label" aria-hidden="true">Animate tokens</span>
        </button>
      </Tooltip>

      <div className="toolbar-group ml-auto">
        <Tooltip label={editLocked ?? 'Remove every element from the canvas'} align="end">
          <button type="button" className="btn btn-ghost btn-danger" onClick={onClear} disabled={isPlaying || isEmpty}>
            <Trash2 />
            <span className="btn-label">Clear canvas</span>
          </button>
        </Tooltip>
        <Tooltip label="Keyboard shortcuts" shortcut="?" align="end">
          <button type="button" className="btn btn-icon btn-ghost" onClick={onShowShortcuts} aria-label="Keyboard shortcuts" aria-keyshortcuts="Shift+?">
            <Keyboard />
          </button>
        </Tooltip>
        <Tooltip label={showInspector ? 'Hide inspector' : 'Show inspector'} shortcut="I" align="end">
          <button
            type="button"
            className="btn btn-icon"
            aria-pressed={showInspector}
            onClick={onToggleInspector}
            aria-label="Inspector"
            aria-keyshortcuts="I"
          >
            <PanelRight />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
