import { clsx } from 'clsx';
import { NetPlace, NetTransition, NetArc } from '../../lib/types';
import {
  getPreIncidenceMatrix,
  getPostIncidenceMatrix,
  getIncidenceMatrix,
} from '../../lib/petrinet';
import { Marking } from '../../lib/model';
import { Grid3x3 } from 'lucide-react';

export default function MatrixPanel({
  places,
  transitions,
  arcs,
  enabledIds,
  initialMarking,
  selectedIds,
}: {
  places: NetPlace[];
  transitions: NetTransition[];
  arcs: NetArc[];
  enabledIds: Set<string>;
  initialMarking: Marking;
  selectedIds: Set<string>;
}) {
  if (places.length === 0 || transitions.length === 0) {
    return (
      <div className="empty-state">
        <Grid3x3 aria-hidden="true" />
        <h4>No matrices yet</h4>
        <p>Add at least one place and one transition to see the incidence matrices.</p>
      </div>
    );
  }

  const pre = getPreIncidenceMatrix(places, transitions, arcs);
  const post = getPostIncidenceMatrix(places, transitions, arcs);
  const inc = getIncidenceMatrix(pre, post);
  const enabled = transitions.filter((t) => enabledIds.has(t.id));

  return (
    <div>
      <section className="section">
        <h3 className="text-[14px]">Marking</h3>
        <p className="hint mb-2">Tokens per place now (M) and in the initial marking (M₀).</p>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th scope="col">Place</th>
                <th scope="col" className="num">M</th>
                <th scope="col" className="num">M₀</th>
              </tr>
            </thead>
            <tbody>
              {places.map((p) => {
                const initial = initialMarking[p.id] ?? p.tokens;
                return (
                  <tr key={p.id} className={clsx(selectedIds.has(p.id) && 'is-selected')}>
                    <th scope="row">{p.name}</th>
                    <td className={clsx('num', p.tokens !== initial && 'font-[650] text-accent')}>{p.tokens}</td>
                    <td className="num text-fg-muted">{initial}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="field-label">Enabled:</span>
          {enabled.length ? (
            enabled.map((t) => (
              <span key={t.id} className="badge badge-accent">{t.name}</span>
            ))
          ) : (
            <span className="badge badge-error">None (deadlock)</span>
          )}
        </div>
      </section>

      <MatrixTable
        title="Pre-incidence W⁻"
        description="Tokens each transition consumes from each place."
        data={pre}
        transitions={transitions}
        places={places}
        selectedIds={selectedIds}
      />
      <MatrixTable
        title="Post-incidence W⁺"
        description="Tokens each transition produces in each place."
        data={post}
        transitions={transitions}
        places={places}
        selectedIds={selectedIds}
      />
      <MatrixTable
        title="Incidence W = W⁺ − W⁻"
        description="Net change in each place when the transition fires."
        data={inc}
        transitions={transitions}
        places={places}
        selectedIds={selectedIds}
        isDiff
      />
    </div>
  );
}

function MatrixTable({
  title,
  description,
  data,
  transitions,
  places,
  selectedIds,
  isDiff,
}: {
  title: string;
  description: string;
  data: number[][];
  transitions: NetTransition[];
  places: NetPlace[];
  selectedIds: Set<string>;
  isDiff?: boolean;
}) {
  return (
    <section className="section">
      <h3 className="text-[14px]">{title}</h3>
      <p className="hint mb-2">{description}</p>
      <div className="table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Place</th>
              {transitions.map((t) => (
                <th key={t.id} scope="col" className={clsx('num', selectedIds.has(t.id) && 'is-selected')} title={t.name}>
                  {t.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={places[i]?.id ?? i} className={clsx(selectedIds.has(places[i]?.id) && 'is-selected')}>
                <th scope="row" title={places[i]?.name}>
                  {places[i]?.name}
                </th>
                {row.map((val, j) => (
                  <td
                    key={j}
                    className={clsx(
                      'num',
                      selectedIds.has(transitions[j].id) && 'is-selected',
                      isDiff && val > 0 && 'text-success',
                      isDiff && val < 0 && 'text-error',
                      val === 0 && 'text-fg-subtle'
                    )}
                  >
                    {isDiff && val > 0 ? `+${val}` : val}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
