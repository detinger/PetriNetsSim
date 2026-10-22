import { useEffect, useRef, useState } from 'react';
import { Node, Edge } from '@xyflow/react';
import { clsx } from 'clsx';
import { Check, X, HelpCircle, Shield, Binary, MousePointerClick, SlidersHorizontal, Trash2, Zap, Lock } from 'lucide-react';
import { Detail, NetAnalysis, STATE_LIMIT, Verdict } from '../../lib/analysis';
import { UndoOptions } from '../CanvasContext';

type UpdateData = (id: string, data: Record<string, unknown>, label: string, options?: UndoOptions) => void;

function formatPath(path: string[], nameOf: (id: string) => string) {
  const names = path.map(nameOf);
  if (names.length > 6) {
    return `${names.slice(0, 3).join(' → ')} → … → ${names.slice(-2).join(' → ')} (${names.length} firings)`;
  }
  return names.join(' → ');
}

function describe(detail: Detail | undefined, nameOf: (id: string) => string): string | null {
  if (!detail) return null;
  switch (detail.kind) {
    case 'bound':
      return detail.bound === 0
        ? 'No place ever holds a token.'
        : `At most ${detail.bound} ${detail.bound === 1 ? 'token' : 'tokens'} in any place.`;
    case 'unbounded':
      return `${detail.places.map(nameOf).join(', ')} can grow without limit.`;
    case 'overfull':
      return detail.path.length
        ? `${nameOf(detail.place)} reaches ${detail.tokens} tokens after ${formatPath(detail.path, nameOf)}.`
        : `${nameOf(detail.place)} already holds ${detail.tokens} tokens in the initial marking.`;
    case 'tokenChange':
      return `The total goes from ${detail.from} to ${detail.to} after ${formatPath(detail.path, nameOf)}.`;
    case 'deadlock':
      return detail.path.length
        ? `Nothing can fire after ${formatPath(detail.path, nameOf)}.`
        : 'No transition is enabled in the initial marking.';
    case 'deadTransition':
      return `${nameOf(detail.transition)} can never fire.`;
    case 'starved':
      return detail.path.length
        ? `${nameOf(detail.transition)} is disabled for good after ${formatPath(detail.path, nameOf)}.`
        : `${nameOf(detail.transition)} can be disabled for good.`;
    case 'noReturn':
      return `The initial marking can't be reached again after ${formatPath(detail.path, nameOf)}.`;
    case 'unknownUnbounded':
      return 'Not decided for unbounded nets.';
    case 'unknownLarge':
      return `Not decided: more than ${detail.limit.toLocaleString()} reachable markings.`;
  }
}

const PropertyIndicator = ({
  label,
  verdict,
  description,
  nameOf,
  failTone = 'warning',
}: {
  label: string;
  verdict: Verdict;
  description: string;
  nameOf: (id: string) => string;
  failTone?: 'warning' | 'error';
}) => {
  const detail = describe(verdict.detail, nameOf);
  return (
    <div className="flex items-start justify-between gap-3 px-3.5 py-2.5 border-t border-line first:border-t-0">
      <div className="min-w-0">
        <div className="text-[13px] font-[600]">{label}</div>
        <div className="hint">{description}</div>
        {detail && (
          <div className={clsx('mt-1 text-[12px]', verdict.value === false ? 'text-fg' : 'text-fg-muted')}>{detail}</div>
        )}
      </div>
      {verdict.value === null ? (
        <span className="badge mt-0.5">
          <HelpCircle aria-hidden="true" /> Unknown
        </span>
      ) : (
        <span className={clsx('badge mt-0.5', verdict.value ? 'badge-success' : failTone === 'error' ? 'badge-error' : 'badge-warning')}>
          {verdict.value ? <Check aria-hidden="true" /> : <X aria-hidden="true" />}
          {verdict.value ? 'Yes' : 'No'}
        </span>
      )}
    </div>
  );
};

function NameField({
  node,
  autoFocus,
  onFocused,
  updateNodeData,
}: {
  node: Node;
  autoFocus: boolean;
  onFocused: () => void;
  updateNodeData: UpdateData;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const kind = node.type === 'place' ? 'place' : 'transition';

  useEffect(() => {
    if (!autoFocus) return;
    inputRef.current?.focus();
    inputRef.current?.select();
    onFocused();
  }, [autoFocus, onFocused]);

  return (
    <div className="field">
      <label className="field-label" htmlFor={`${kind}-name`}>Name</label>
      <input
        ref={inputRef}
        id={`${kind}-name`}
        type="text"
        value={node.data.name as string}
        onChange={(e) => updateNodeData(node.id, { name: e.target.value }, 'Rename', { key: `name:${node.id}` })}
        className="input"
      />
    </div>
  );
}

export default function PropertiesPanel({
  selectedNodes,
  selectedEdges,
  analysis,
  enabledIds,
  isPlaying,
  nameOf,
  focusNameId,
  onFocusedName,
  updateNodeData,
  updateEdgeData,
  setTokens,
  onDelete,
  onFire,
}: {
  selectedNodes: Node[];
  selectedEdges: Edge[];
  analysis: NetAnalysis | null;
  enabledIds: Set<string>;
  isPlaying: boolean;
  nameOf: (id: string) => string;
  focusNameId: string | null;
  onFocusedName: () => void;
  updateNodeData: UpdateData;
  updateEdgeData: UpdateData;
  setTokens: (placeIds: string[], tokens: number) => void;
  onDelete: (nodes: Node[], edges: Edge[]) => void;
  onFire: (transitionId: string) => void;
}) {
  const selectionCount = selectedNodes.length + selectedEdges.length;
  const selectedNode = selectionCount === 1 ? selectedNodes[0] : undefined;
  const selectedEdge = selectionCount === 1 ? selectedEdges[0] : undefined;
  const selectedPlaces = selectedNodes.filter((n) => n.type === 'place');
  const [bulkTokens, setBulkTokens] = useState('');

  const deleteButton = (
    <button type="button" className="btn btn-sm btn-ghost btn-danger" onClick={() => onDelete(selectedNodes, selectedEdges)}>
      <Trash2 /> Delete
    </button>
  );

  return (
    <div>
      <section className="section" aria-labelledby="selection-heading">
        <h3 id="selection-heading" className="section-title">
          <SlidersHorizontal aria-hidden="true" /> Selection
        </h3>

        {isPlaying && selectionCount > 0 && (
          <p className="hint mb-2 flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5" aria-hidden="true" /> Pause the simulation to edit.
          </p>
        )}

        <fieldset disabled={isPlaying} className="m-0 min-w-0 border-0 p-0">
          {selectedNode && selectedNode.type === 'place' && (
            <div className="card p-3.5">
              <div className="mb-3 flex items-center gap-2">
                <span className="badge badge-primary">Place</span>
                <code className="truncate text-fg-subtle">{selectedNode.id}</code>
              </div>
              <NameField
                node={selectedNode}
                autoFocus={focusNameId === selectedNode.id}
                onFocused={onFocusedName}
                updateNodeData={updateNodeData}
              />
              <div className="field">
                <label className="field-label" htmlFor="place-tokens">Tokens</label>
                <input
                  id="place-tokens"
                  type="number"
                  min="0"
                  value={selectedNode.data.tokens as number}
                  onChange={(e) =>
                    updateNodeData(selectedNode.id, { tokens: Math.max(0, parseInt(e.target.value) || 0) }, 'Change tokens', {
                      key: `tokens:${selectedNode.id}`,
                      markingIds: [selectedNode.id],
                    })
                  }
                  className="input"
                  aria-describedby="place-tokens-hint"
                />
                <span id="place-tokens-hint" className="hint">
                  Changes made before the first step also set the initial marking.
                </span>
              </div>
              <div className="mt-3 flex justify-end border-t border-line pt-3">{deleteButton}</div>
            </div>
          )}

          {selectedNode && selectedNode.type === 'transition' && (
            <div className="card p-3.5">
              <div className="mb-3 flex items-center gap-2">
                <span className="badge badge-primary">Transition</span>
                <code className="truncate text-fg-subtle">{selectedNode.id}</code>
                <span className={clsx('badge ml-auto', enabledIds.has(selectedNode.id) && 'badge-accent')}>
                  {enabledIds.has(selectedNode.id) ? 'Enabled' : 'Not enabled'}
                </span>
              </div>
              <NameField
                node={selectedNode}
                autoFocus={focusNameId === selectedNode.id}
                onFocused={onFocusedName}
                updateNodeData={updateNodeData}
              />
              <div className="mt-3 flex items-center justify-between gap-2 border-t border-line pt-3">
                <button
                  type="button"
                  className="btn btn-sm btn-primary"
                  onClick={() => onFire(selectedNode.id)}
                  disabled={!enabledIds.has(selectedNode.id)}
                  title={enabledIds.has(selectedNode.id) ? 'Fire this transition' : 'Its input places lack tokens'}
                >
                  <Zap /> Fire
                </button>
                {deleteButton}
              </div>
            </div>
          )}

          {selectedEdge && (
            <div className="card p-3.5">
              <div className="mb-3 flex items-center gap-2 min-w-0">
                <span className="badge badge-primary">Arc</span>
                <span className="truncate text-[13px] text-fg-muted">
                  {nameOf(selectedEdge.source)} → {nameOf(selectedEdge.target)}
                </span>
              </div>
              <div className="field">
                <label className="field-label" htmlFor="arc-weight">Weight</label>
                <input
                  id="arc-weight"
                  type="number"
                  min="1"
                  value={(selectedEdge.data?.weight as number) || 1}
                  onChange={(e) =>
                    updateEdgeData(selectedEdge.id, { weight: Math.max(1, parseInt(e.target.value) || 1) }, 'Change weight', {
                      key: `weight:${selectedEdge.id}`,
                    })
                  }
                  className="input"
                  aria-describedby="arc-weight-hint"
                />
                <span id="arc-weight-hint" className="hint">
                  Tokens consumed or produced each time the transition fires. You can also double-click the arc.
                </span>
              </div>
              <div className="mt-3 flex justify-end border-t border-line pt-3">{deleteButton}</div>
            </div>
          )}

          {selectionCount > 1 && (
            <div className="card p-3.5">
              <div className="mb-1 font-[650]">{selectionCount} elements selected</div>
              <p className="hint mb-3">
                {[
                  [selectedPlaces.length, 'place', 'places'],
                  [selectedNodes.length - selectedPlaces.length, 'transition', 'transitions'],
                  [selectedEdges.length, 'arc', 'arcs'],
                ]
                  .filter(([count]) => count)
                  .map(([count, one, many]) => `${count} ${count === 1 ? one : many}`)
                  .join(', ')}
              </p>
              {selectedPlaces.length > 0 && (
                <form
                  className="field"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (bulkTokens === '') return;
                    setTokens(selectedPlaces.map((p) => p.id), Math.max(0, parseInt(bulkTokens) || 0));
                    setBulkTokens('');
                  }}
                >
                  <label className="field-label" htmlFor="bulk-tokens">
                    Tokens in the {selectedPlaces.length} selected {selectedPlaces.length === 1 ? 'place' : 'places'}
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="bulk-tokens"
                      type="number"
                      min="0"
                      value={bulkTokens}
                      placeholder="e.g. 1"
                      onChange={(e) => setBulkTokens(e.target.value)}
                      className="input"
                    />
                    <button type="submit" className="btn" disabled={bulkTokens === ''}>Apply</button>
                  </div>
                </form>
              )}
              <div className="mt-3 flex justify-end border-t border-line pt-3">{deleteButton}</div>
            </div>
          )}
        </fieldset>

        {selectionCount === 0 && (
          <div className="card empty-state !py-6">
            <MousePointerClick aria-hidden="true" />
            <h4>Nothing selected</h4>
            <p>Select a place, transition, or arc on the canvas to edit it. Shift-click to select several.</p>
          </div>
        )}
      </section>

      {analysis && (
        <>
          <p className="hint mt-5 mb-3">
            Properties of the net from its initial marking M₀.{' '}
            {analysis.hasOmega
              ? `Explored a coverability graph of ${analysis.states.length} markings (ω = unbounded).`
              : analysis.truncated
                ? `Stopped after ${STATE_LIMIT.toLocaleString()} reachable markings.`
                : analysis.states.length === 1
                  ? 'The initial marking is the only reachable marking.'
                  : `Explored all ${analysis.states.length} reachable markings.`}
          </p>

          <section className="section !mt-0" aria-labelledby="boundedness-heading">
            <h3 id="boundedness-heading" className="section-title">
              <Shield aria-hidden="true" /> Boundedness
            </h3>
            <div className="card">
              <PropertyIndicator label="Bounded" verdict={analysis.bounded} nameOf={nameOf} description="No place can collect tokens without limit." />
              <PropertyIndicator label="Safe" verdict={analysis.safe} nameOf={nameOf} description="No place ever holds more than one token." />
              <PropertyIndicator label="Conservative" verdict={analysis.conservative} nameOf={nameOf} description="The total number of tokens never changes." />
            </div>
          </section>

          <section className="section" aria-labelledby="behavior-heading">
            <h3 id="behavior-heading" className="section-title">
              <Binary aria-hidden="true" /> Behavior
            </h3>
            <div className="card">
              <PropertyIndicator label="Deadlock free" verdict={analysis.deadlockFree} nameOf={nameOf} description="Some transition is always enabled." failTone="error" />
              <PropertyIndicator label="Live" verdict={analysis.live} nameOf={nameOf} description="Every transition can always fire again later." />
              <PropertyIndicator label="Reversible" verdict={analysis.reversible} nameOf={nameOf} description="The initial marking can always be reached again." />
            </div>
          </section>
        </>
      )}
    </div>
  );
}
