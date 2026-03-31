import { Dispatch, SetStateAction } from 'react';
import { Node, Edge } from '@xyflow/react';
import { clsx } from 'clsx';
import { NetProperties } from '../../lib/types';
import { CheckCircle2, XCircle, Shield, Binary, Activity } from 'lucide-react';

const PropertyIndicator = ({ label, value, description }: { label: string; value: boolean; description: string }) => (
  <div className="flex items-center justify-between py-2 border-b border-nord-2/10 last:border-0 group">
    <div className="flex flex-col">
      <span className="text-[10px] font-bold text-nord-4 tracking-tight uppercase">{label}</span>
      <span className="text-[9px] text-nord-3 italic opacity-60 group-hover:opacity-100 transition-opacity line-clamp-1">{description}</span>
    </div>
    <div className={clsx(
      "flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase transition-all shadow-sm border",
      value ? "bg-nord-14/15 text-nord-14 border-nord-14/30" : "bg-nord-11/15 text-nord-11 border-nord-11/30"
    )}>
      {value ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {value ? "Yes" : "No"}
    </div>
  </div>
);

export default function PropertiesPanel({
  selectedNodes,
  selectedEdges,
  setNodes,
  setEdges,
  netProps,
}: {
  selectedNodes: Node[];
  selectedEdges: Edge[];
  setNodes: Dispatch<SetStateAction<Node[]>>;
  setEdges: Dispatch<SetStateAction<Edge[]>>;
  netProps: NetProperties;
}) {
  const selectedNode = selectedNodes[0];
  const selectedEdge = selectedEdges[0];

  const updateNodeData = (id: string, newData: any) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...newData } } : n))
    );
  };

  const updateEdgeData = (id: string, newData: any) => {
    setEdges((eds) => eds.map((e) => (e.id === id ? { ...e, data: { ...e.data, ...newData } } : e)));
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto pr-2 custom-scrollbar">
      <div className="mb-8">
        <h2 className="text-xs font-black uppercase tracking-widest text-nord-9 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4" /> Properties
        </h2>
        
        {selectedNode && selectedNode.type === 'place' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-nord-3 mb-1">Place Name</label>
              <input
                type="text"
                value={selectedNode.data.name as string}
                onChange={(e) => updateNodeData(selectedNode.id, { name: e.target.value })}
                className="w-full bg-nord-0 border border-nord-3 text-nord-4 rounded px-3 py-2 text-sm focus:outline-none focus:border-nord-8 transition-colors shadow-inner"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-nord-3 mb-1">Marking (Tokens)</label>
              <input
                type="number"
                min="0"
                value={selectedNode.data.tokens as number}
                onChange={(e) => updateNodeData(selectedNode.id, { tokens: parseInt(e.target.value) || 0 })}
                className="w-full bg-nord-0 border border-nord-3 text-nord-4 rounded px-3 py-2 text-sm focus:outline-none focus:border-nord-8 transition-colors shadow-inner"
              />
            </div>
          </div>
        )}

        {selectedNode && selectedNode.type === 'transition' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-nord-3 mb-1">Transition Name</label>
              <input
                type="text"
                value={selectedNode.data.name as string}
                onChange={(e) => updateNodeData(selectedNode.id, { name: e.target.value })}
                className="w-full bg-nord-0 border border-nord-3 text-nord-4 rounded px-3 py-2 text-sm focus:outline-none focus:border-nord-14 transition-colors shadow-inner"
              />
            </div>
          </div>
        )}

        {selectedEdge && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-nord-3 mb-2 px-1">Arc Weight</label>
              <input
                type="number"
                min="1"
                value={(selectedEdge.data?.weight as number) || 1}
                onChange={(e) => updateEdgeData(selectedEdge.id, { weight: parseInt(e.target.value) || 1 })}
                className="w-full bg-nord-0 border border-nord-3 text-nord-4 rounded px-3 py-2 text-sm focus:outline-none focus:border-nord-8 transition-colors shadow-inner"
              />
            </div>
            
          </div>
        )}
        {!selectedNode && !selectedEdge && (
          <div className="bg-nord-1/20 border border-dashed border-nord-3 rounded-lg p-4 text-center">
            <p className="text-nord-3 text-[11px] italic">Select an element to modify properties.</p>
          </div>
        )}
      </div>

      <div className="mb-8">
        <h2 className="text-xs font-black uppercase tracking-widest text-nord-7 mb-4 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Structural Analysis
        </h2>
        <div className="bg-nord-1/30 rounded-lg p-3 border border-nord-2 space-y-1">
          <PropertyIndicator label="Safe" value={netProps.isSafe} description="Max 1 token per place at all times." />
          <PropertyIndicator label="Bounded" value={netProps.isBounded} description="The total number of tokens is finite." />
          <PropertyIndicator label="Conservative" value={netProps.isConservative} description="Total tokens are preserved across firings." />
        </div>
      </div>

      <div className="mb-8">
        <h2 className="text-xs font-black uppercase tracking-widest text-nord-13 mb-4 flex items-center gap-2">
          <Binary className="w-4 h-4" /> Behavioral Analysis
        </h2>
        <div className="bg-nord-1/30 rounded-lg p-3 border border-nord-2 space-y-1">
          <PropertyIndicator label="Live" value={netProps.isLive} description="All transitions can eventually fire." />
          <PropertyIndicator label="Reversible" value={netProps.isReversible} description="System can return to initial marking." />
          <PropertyIndicator label="Deadlock Free" value={!netProps.hasDeadlock} description="At least one transition is enabled." />
        </div>
      </div>

    </div>
  );
}
