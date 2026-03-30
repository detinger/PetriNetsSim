import { Circle, Square, Play, StepForward, StepBack, StopCircle, RefreshCcw, Sparkles, Layers, Activity } from 'lucide-react';
import { clsx } from 'clsx';

export default function Toolbar({
  addPlace,
  addTransition,
  onPlay,
  onStep,
  onStepBack,
  onReset,
  onClear,
  showAnimations,
  onToggleAnimations,
  showProperties,
  onToggleProperties,
  showMatrix,
  onToggleMatrix,
  isPlaying,
  deadlock,
  historyCount,
}: {
  addPlace: () => void;
  addTransition: () => void;
  onPlay: () => void;
  onStep: () => void;
  onStepBack: () => void;
  onReset: () => void;
  onClear: () => void;
  showAnimations: boolean;
  onToggleAnimations: () => void;
  showProperties: boolean;
  onToggleProperties: () => void;
  showMatrix: boolean;
  onToggleMatrix: () => void;
  isPlaying: boolean;
  deadlock: boolean;
  historyCount: number;
}) {
  return (
    <div className="flex flex-col gap-8 h-full">
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-nord-3 mb-3 border-b border-nord-2 pb-1 flex justify-between items-center">
          Elements
        </h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={addPlace}
            className="flex items-center gap-3 px-3 py-2.5 bg-nord-1 hover:bg-nord-2 border border-nord-3 rounded transition-colors text-nord-4 shadow-sm"
          >
            <Circle className="w-4 h-4 text-nord-8" />
            <span className="text-sm font-medium tracking-wide">Add Place</span>
          </button>
          <button
            onClick={addTransition}
            className="flex items-center gap-3 px-3 py-2.5 bg-nord-1 hover:bg-nord-2 border border-nord-3 rounded transition-colors text-nord-4 shadow-sm"
          >
            <Square className="w-4 h-4 text-nord-14" />
            <span className="text-sm font-medium tracking-wide">Add Transition</span>
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-nord-3 mb-3 border-b border-nord-2 pb-1 flex justify-between items-center">
          Simulation
          {deadlock && <span className="text-nord-11 text-[10px] bg-nord-11/20 px-1 rounded animate-pulse">DEADLOCK</span>}
        </h3>
        <div className="flex flex-col gap-2 relative">
          <button
            onClick={onPlay}
            disabled={deadlock}
            className={clsx(
              "flex items-center gap-3 px-3 py-2.5 rounded border transition-all shadow-sm",
              isPlaying 
                ? "bg-nord-11/20 border-nord-11/50 hover:bg-nord-11/30 text-nord-11" 
                : "bg-nord-14/20 border-nord-14/50 hover:bg-nord-14/30 text-nord-14 disabled:opacity-30",
            )}
          >
            {isPlaying ? <StopCircle className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span className="text-[11px] font-bold uppercase tracking-wider">{isPlaying ? 'Stop' : 'Play'}</span>
          </button>

          <button
            onClick={onStep}
            disabled={isPlaying || deadlock}
            className="flex items-center gap-3 px-3 py-2.5 bg-nord-8/20 border border-nord-8/50 hover:bg-nord-8/30 text-nord-8 rounded transition-all disabled:opacity-30 shadow-sm"
          >
            <StepForward className="w-5 h-5" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Step Forward</span>
          </button>

          <button
            onClick={onStepBack}
            disabled={isPlaying || historyCount === 0}
            className="flex items-center gap-3 px-3 py-2.5 bg-nord-9/20 border border-nord-9/50 hover:bg-nord-9/30 text-nord-9 rounded transition-all disabled:opacity-30 shadow-sm"
          >
            <StepBack className="w-5 h-5" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Step Backward</span>
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-3 px-3 py-2.5 bg-nord-1/50 hover:bg-nord-2/50 border border-nord-3 text-nord-4 rounded transition-all shadow-sm"
          >
            <RefreshCcw className="w-5 h-5 text-nord-7" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Restart Model</span>
          </button>

          <button
            onClick={onClear}
            className="flex items-center gap-3 px-3 py-2.5 bg-nord-11/10 hover:bg-nord-11/20 border border-nord-11/20 hover:border-nord-11/40 text-nord-11 rounded transition-all shadow-sm"
          >
            <StopCircle className="w-5 h-5 text-nord-11/70" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Clear Canvas</span>
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-nord-3 mb-3 border-b border-nord-2 pb-1">
          View Controls
        </h3>
        <div className="flex flex-col gap-2">
          <button
            onClick={onToggleAnimations}
            className={clsx(
              "flex items-center gap-3 px-3 py-2 bg-nord-1 hover:bg-nord-2 rounded border transition-colors",
              showAnimations ? "border-nord-13 text-nord-13" : "border-nord-3 text-nord-3"
            )}
            title="Toggle Token Flow Animation"
          >
            <Sparkles className={clsx("w-5 h-5", showAnimations && "animate-spin-slow")} />
            <span className="text-sm font-medium">Auto-Flow: {showAnimations ? 'ON' : 'OFF'}</span>
          </button>
          
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onToggleProperties}
              className={clsx(
                "flex flex-col items-center gap-1.5 px-2 py-2.5 bg-nord-1 hover:bg-nord-2 rounded border transition-colors",
                showProperties ? "border-nord-10 text-nord-10" : "border-nord-3 text-nord-3"
              )}
              title="Toggle Properties Panel"
            >
              <Activity className={clsx("w-5 h-5", showProperties && "text-nord-10")} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Props</span>
            </button>
            <button
              onClick={onToggleMatrix}
              className={clsx(
                "flex flex-col items-center gap-1.5 px-2 py-2.5 bg-nord-1 hover:bg-nord-2 rounded border transition-colors",
                showMatrix ? "border-nord-14 text-nord-14" : "border-nord-3 text-nord-3"
              )}
              title="Toggle Matrix View"
            >
              <Layers className={clsx("w-5 h-5", showMatrix && "text-nord-14")} />
              <span className="text-[9px] font-bold uppercase tracking-wider">Matrix</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
