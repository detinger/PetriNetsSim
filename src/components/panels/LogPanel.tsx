import { AlertTriangle, ScrollText } from 'lucide-react';
import { LogEntry, NetPlace } from '../../lib/types';

export default function LogPanel({
  log,
  places,
  deadlock,
}: {
  log: LogEntry[];
  places: NetPlace[];
  deadlock: boolean;
}) {
  const formatMarking = (marking: LogEntry['marking']) =>
    `(${places.map((p) => marking[p.id] ?? '–').join(', ')})`;

  return (
    <div>
      {deadlock && (
        <div className="callout callout-error mb-3" role="status">
          <AlertTriangle aria-hidden="true" />
          <div>
            <div className="callout-title">Deadlock</div>
            No transition is enabled, so the simulation can't continue. Step back, reset, or change the marking.
          </div>
        </div>
      )}

      {log.length === 0 ? (
        <div className="empty-state">
          <ScrollText aria-hidden="true" />
          <h4>No firings yet</h4>
          <p>Press Step, Run simulation, or double-click an enabled transition. Each firing is listed here.</p>
        </div>
      ) : (
        <>
          <p className="hint mb-2">
            Newest first. Markings list tokens in the order {places.map((p) => p.name).join(', ')}.
          </p>
          <ol className="table-wrap m-0 list-none p-0">
            {[...log].reverse().map((entry) => (
              <li
                key={entry.step}
                className="flex items-baseline gap-2.5 border-t border-line px-2.5 py-1.5 first:border-t-0 hover:bg-hovered"
              >
                <span className="w-8 shrink-0 text-right font-mono text-[12px] tabular-nums text-fg-subtle">#{entry.step}</span>
                <span className="min-w-0 flex-1">
                  <span className="font-[600]">{entry.transitionName}</span>
                  <span
                    className="ml-2 font-mono text-[12px] text-fg-muted"
                    title={places.map((p) => `${p.name}=${entry.marking[p.id] ?? '–'}`).join(', ')}
                  >
                    → {formatMarking(entry.marking)}
                  </span>
                </span>
                <time className="shrink-0 text-[11px] tabular-nums text-fg-subtle" dateTime={new Date(entry.time).toISOString()}>
                  {new Date(entry.time).toLocaleTimeString()}
                </time>
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}
