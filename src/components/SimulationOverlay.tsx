import { LogEntry } from '../lib/types';

interface Props {
  isPlaying: boolean;
  isAnimating: boolean;
  stepCount: number;
  recentLog: LogEntry[];
  deadlock: boolean;
  enabledCount: number;
}

export default function SimulationOverlay({ isPlaying, isAnimating, stepCount, recentLog, deadlock, enabledCount }: Props) {
  if (!isPlaying && !isAnimating && stepCount === 0) return null;

  const lastFired = recentLog[recentLog.length - 1];
  const mini = recentLog.slice(-3);

  return (
    <div className="sim-overlay" role="status" aria-live="polite" aria-label="Simulation status">
      <span className="sim-overlay-dot" aria-hidden="true" />

      <div className="flex flex-col gap-0.5">
        {/* Status line */}
        <div className="flex items-center gap-2">
          {isAnimating ? (
            <span className="opacity-90">Firing <strong>{lastFired?.transitionName ?? '…'}</strong></span>
          ) : deadlock ? (
            <span className="text-red-400 font-semibold">Deadlock — no transitions enabled</span>
          ) : isPlaying ? (
            <span className="opacity-90">Running · <strong>{enabledCount}</strong> enabled</span>
          ) : (
            <span className="opacity-90">Paused · step <strong>{stepCount}</strong></span>
          )}
          {stepCount > 0 && !isAnimating && (
            <span className="opacity-50 text-[11px]">step {stepCount}</span>
          )}
        </div>

        {/* Mini log: last 3 fired transitions */}
        {mini.length > 0 && (
          <div className="flex gap-1 mt-0.5 flex-wrap">
            {mini.map((entry, i) => (
              <span
                key={entry.step}
                className="text-[10px] px-1.5 py-0.5 rounded-full border border-current"
                style={{ opacity: 0.4 + (i / mini.length) * 0.6 }}
              >
                {entry.transitionName}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
