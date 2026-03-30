import { clsx } from 'clsx';
import { NetPlace, NetTransition, NetArc } from '../../lib/types';
import {
  getPreIncidenceMatrix,
  getPostIncidenceMatrix,
  getIncidenceMatrix,
} from '../../lib/petrinet';
import { Layers } from 'lucide-react';

export default function MatrixPanel({
  places,
  transitions,
  arcs,
}: {
  places: NetPlace[];
  transitions: NetTransition[];
  arcs: NetArc[];
}) {
  const pre = getPreIncidenceMatrix(places, transitions, arcs);
  const post = getPostIncidenceMatrix(places, transitions, arcs);
  const inc = getIncidenceMatrix(pre, post);

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-2 custom-scrollbar">
      <div className="mb-8">
        <h2 className="text-xs font-black uppercase tracking-widest text-nord-4 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4" /> Matrix View
        </h2>
        <div className="space-y-6">
          <MatrixTable title="Pre-Incidence (W-)" data={pre} transitions={transitions} places={places} />
          <MatrixTable title="Post-Incidence (W+)" data={post} transitions={transitions} places={places} />
          <MatrixTable title="Incidence Matrix (W)" data={inc} transitions={transitions} places={places} isDiff />
        </div>
      </div>
    </div>
  );
}

function MatrixTable({ title, data, transitions, places, isDiff }: { title: string; data: number[][]; transitions: NetTransition[]; places: NetPlace[]; isDiff?: boolean }) {
  return (
    <div>
      <p className="text-[9px] uppercase text-nord-3 font-bold mb-2 tracking-widest pl-1">{title}</p>
      <div className="bg-nord-1/50 p-3 rounded-lg overflow-x-auto border border-nord-2 shadow-sm font-mono text-[10px]">
        <div className="flex gap-2 py-1 mb-1 border-b border-nord-2">
          <span className="w-12 shrink-0" />
          {transitions.map((t) => (
            <span key={t.id} className="w-6 text-center text-[7px] font-bold text-nord-10 uppercase truncate" title={t.name}>{t.name}</span>
          ))}
        </div>
        {data.length > 0 ? data.map((row, i) => (
          <div key={i} className="flex gap-2 py-1 border-b border-nord-2/10 last:border-0 items-center">
            <span className="w-12 text-left text-nord-3 shrink-0 font-bold truncate" title={places[i]?.name}>{places[i]?.name}</span>
            {row.map((val, j) => (
              <span key={j} className={clsx(
                "w-6 text-center inline-block",
                isDiff ? (val > 0 ? "text-nord-14" : val < 0 ? "text-nord-11" : "text-nord-4 opacity-30") : "text-nord-4"
              )}>{val}</span>
            ))}
          </div>
        )) : <div className="text-center py-2 text-nord-2 italic">Empty</div>}
      </div>
    </div>
  );
}
