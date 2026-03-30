import { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ReactFlowProvider, Node, Edge, useNodesState, useEdgesState } from '@xyflow/react';
import PetriCanvas from './components/PetriCanvas';
import Toolbar from './components/panels/Toolbar';
import PropertiesPanel from './components/panels/PropertiesPanel';
import MatrixPanel from './components/panels/MatrixPanel';
import { examples } from './examples/library';
import { getEnabledTransitions, fireTransition, analyzeNet } from './lib/petrinet';
import { NetPlace, NetTransition, NetArc } from './lib/types';
import { parsePnml } from './lib/pnmlParser';

export default function App() {
  const [nodes, setNodes] = useNodesState<Node>(examples[0].nodes);
  const [edges, setEdges] = useEdgesState<Edge>(examples[0].edges);
  
  const [initialNodes, setInitialNodes] = useState<Node[]>(examples[0].nodes);
  const [initialEdges, setInitialEdges] = useState<Edge[]>(examples[0].edges);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [showAnimations, setShowAnimations] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [history, setHistory] = useState<{ nodes: Node[]; edges: Edge[]; log: string[] }[]>([]);
  const [selectedExampleId, setSelectedExampleId] = useState(examples[0].id);
  const [showProperties, setShowProperties] = useState(true);
  const [showMatrix, setShowMatrix] = useState(false);

  // Derived Petri Net state with useMemo to ensure stable references
  const { places, transitions, arcs, enabledTransitions, deadlock, netProps } = useMemo(() => {
    const p: NetPlace[] = nodes
      .filter((n) => n.type === 'place')
      .map((n) => ({ 
        id: n.id, 
        name: (n.data?.name as string) || n.id, 
        tokens: Number(n.data?.tokens) || 0 
      }));
      
    const t: NetTransition[] = nodes
      .filter((n) => n.type === 'transition')
      .map((n) => ({ 
        id: n.id, 
        name: (n.data?.name as string) || n.id 
      }));
      
    const a: NetArc[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      weight: (e.data?.weight as number) || 1,
    }));

    const et = getEnabledTransitions(p, t, a);
    const dl = t.length > 0 && et.length === 0;

    const initialPlaces: NetPlace[] = initialNodes
      .filter((n) => n.type === 'place')
      .map((n) => ({ 
        id: n.id, 
        name: (n.data?.name as string) || n.id, 
        tokens: Number(n.data?.tokens) || 0 
      }));

    const netProps = analyzeNet(p, initialPlaces, t, a);

    return { places: p, transitions: t, arcs: a, enabledTransitions: et, deadlock: dl, netProps };
  }, [nodes, edges, initialNodes]);

  useEffect(() => {
    setNodes((nds) => {
      let changed = false;
      const next = nds.map((n) => {
        if (n.type === 'transition') {
          const isEnabled = enabledTransitions.some((et) => et.id === n.id);
          if (n.data.isEnabled !== isEnabled) {
            changed = true;
            return { ...n, data: { ...n.data, isEnabled } };
          }
        }
        return n;
      });
      return changed ? next : nds;
    });
  }, [enabledTransitions, setNodes]);

  const loadExample = (id: string) => {
    const ex = examples.find((e) => e.id === id);
    if (ex) {
      setNodes(ex.nodes);
      setEdges(ex.edges);
      setInitialNodes(ex.nodes);
      setInitialEdges(ex.edges);
      setSelectedExampleId(id);
      setIsPlaying(false);
      setLog([]);
      setHistory([]);
    }
  };

  const handleReset = useCallback(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
    setIsPlaying(false);
    setLog([]);
    setHistory([]);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleClear = useCallback(() => {
    setNodes([]);
    setEdges([]);
    setInitialNodes([]);
    setInitialEdges([]);
    setIsPlaying(false);
    setLog([]);
    setHistory([]);
    setSelectedExampleId('empty');
  }, [setNodes, setEdges]);

  // Save initial state when user modifies topology BEFORE simulation
  useEffect(() => {
    if (!isPlaying && log.length === 0) {
      setInitialNodes(nodes);
      setInitialEdges(edges);
    }
  }, [JSON.stringify(nodes), JSON.stringify(edges)]); 

  const handleStep = useCallback(() => {
    if (deadlock) {
      setIsPlaying(false);
      return;
    }

    // Save current state to history BEFORE firing
    setHistory((prev) => [...prev, { nodes, edges, log }]);

    const tToFire = enabledTransitions[Math.floor(Math.random() * enabledTransitions.length)];
    
    // Logic for Flow Animation (Two-Phase with physical token subtraction/addition)
    if (showAnimations) {
      const inArcIds = edges.filter(e => e.target === tToFire.id).map(e => e.id);
      const outArcIds = edges.filter(e => e.source === tToFire.id).map(e => e.id);
      
      // Get participating places and how many tokens they contribute/receive
      const inArcsFromPlaces = arcs.filter(a => a.target === tToFire.id);
      const outArcsToPlaces = arcs.filter(a => a.source === tToFire.id);

      // 1. Subtract tokens from source places IMMEDIATELY as flow starts
      setNodes((nds) => nds.map((n) => {
        if (n.type === 'place') {
          const arc = inArcsFromPlaces.find(a => a.source === n.id);
          if (arc) return { ...n, data: { ...n.data, tokens: Math.max(0, (n.data.tokens as number) - arc.weight) } };
        }
        return n;
      }));

      // 2. Start Phase 1 Animation
      setEdges(eds => eds.map(e => inArcIds.includes(e.id) ? { ...e, data: { ...e.data, isFiring: true } } : e));
      
      setTimeout(() => {
        // 3. Stop Phase 1, Start Phase 2
        setEdges(eds => eds.map(e => {
          if (inArcIds.includes(e.id)) return { ...e, data: { ...e.data, isFiring: false } };
          if (outArcIds.includes(e.id)) return { ...e, data: { ...e.data, isFiring: true } };
          return e;
        }));

        setTimeout(() => {
          // 4. End Phase 2: Add tokens to target places
          setNodes((nds) => nds.map((n) => {
            if (n.type === 'place') {
              const arcs = outArcsToPlaces.filter(a => a.target === n.id);
              if (arcs.length > 0) {
                const totalAdded = arcs.reduce((acc, a) => acc + a.weight, 0);
                return { ...n, data: { ...n.data, tokens: (n.data.tokens as number) + totalAdded } };
              }
            }
            return n;
          }));
          
          setEdges(eds => eds.map(e => ({ ...e, data: { ...e.data, isFiring: false } })));
          
          setLog((prev) => [
            `${tToFire.name} fired at ${new Date().toLocaleTimeString()}`,
            ...prev.slice(0, 49),
          ]);
        }, 300); // Phase 2: 300ms
      }, 300); // Phase 1: 300ms
    } else {
      const newPlaces = fireTransition(places, transitions, arcs, tToFire.id, enabledTransitions);
      setNodes((nds) => nds.map((n) => {
        if (n.type === 'place') {
          const np = newPlaces.find((p) => p.id === n.id);
          if (np && np.tokens !== n.data.tokens) return { ...n, data: { ...n.data, tokens: np.tokens } };
        }
        return n;
      }));
    }
    
    setLog((prev) => [...prev, `Fired: ${tToFire.name}`]);
  }, [deadlock, enabledTransitions, places, transitions, arcs, setNodes, setEdges, nodes, edges, log, showAnimations]);

  const handleStepRef = useRef<any>(null);
  handleStepRef.current = handleStep;

  const handleStepBack = useCallback(() => {
    if (history.length === 0) return;
    
    const lastState = history[history.length - 1];
    setNodes(lastState.nodes);
    setEdges(lastState.edges);
    setLog(lastState.log);
    setHistory((prev) => prev.slice(0, -1));
  }, [history]);

  useEffect(() => {
    if (isPlaying && !deadlock) {
      const interval = setInterval(() => {
        handleStepRef.current();
      }, 800);
      return () => clearInterval(interval);
    }
  }, [isPlaying, deadlock]);

  const addPlace = () => {
    const id = `p${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'place',
      position: { x: Math.random() * 200 + 50, y: Math.random() * 200 + 50 },
      data: { name: `p${places.length + 1}`, tokens: 0 },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const addTransition = () => {
    const id = `t${Date.now()}`;
    const newNode: Node = {
      id,
      type: 'transition',
      position: { x: Math.random() * 200 + 50, y: Math.random() * 200 + 50 },
      data: { name: `t${transitions.length + 1}` },
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const selectedNodes = nodes.filter((n) => n.selected);
  const selectedEdges = edges.filter((e) => e.selected);

  return (
    <div className="w-screen h-screen flex flex-col bg-nord-0 text-white font-sans">
      <header className="p-4 bg-nord-0 border-b border-nord-1 flex justify-between items-center z-10 shadow-lg">
        <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-nord-8 to-nord-9 bg-clip-text text-transparent">
          AdamSim | Petri Nets Simulator
        </h1>
        <div className="flex gap-4 items-center">
          <div className="flex gap-2">
            <button
              onClick={() => {
                try {
                  const data = JSON.stringify({ 
                    nodes, 
                    edges,
                    metadata: {
                      version: "1.0",
                      timestamp: new Date().toISOString(),
                      name: selectedExampleId || 'custom-model'
                    }
                  }, null, 2);
                  
                  const fileName = `petri-net-${(selectedExampleId || 'model').replace(/[^a-z0-9]/gi, '-')}.json`;

                  // 1. Try modern File System Access API (Native Chrome 'Save As' dialog)
                  if ('showSaveFilePicker' in window) {
                    const pickerOptions = {
                      suggestedName: fileName,
                      types: [{
                        description: 'Petri Net Model',
                        accept: { 'application/json': ['.json'] },
                      }],
                    };
                    (window as any).showSaveFilePicker(pickerOptions)
                      .then((handle: any) => handle.createWritable())
                      .then((writable: any) => {
                        writable.write(data);
                        writable.close();
                        setLog(prev => [...prev, `Model saved via System Dialog: ${fileName}`]);
                      })
                      .catch((err: any) => {
                        if (err.name !== 'AbortError') console.error(err);
                      });
                  } else {
                    // 2. Fallback for Safari/Firefox/Other
                    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(data)}`;
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = dataUri;
                    a.download = fileName;
                    document.body.appendChild(a);
                    a.click();
                    setTimeout(() => document.body.removeChild(a), 300);
                    setLog(prev => [...prev, `Model downloaded: ${fileName}`]);
                  }
                } catch (err) {
                  alert('Failed to export diagram.');
                  console.error(err);
                }
              }}
              className="px-4 py-1.5 bg-nord-8 hover:bg-nord-9 text-nord-0 rounded-md text-[11px] font-black uppercase tracking-widest transition-all hover:shadow-[0_0_15px_rgba(136,192,208,0.4)] shadow-lg"
            >
              Download Model (.json)
            </button>
            <label className="px-3 py-1.5 bg-nord-1 hover:bg-nord-2 border border-nord-3 rounded text-xs font-bold uppercase tracking-wider text-nord-4 transition-colors cursor-pointer">
              Import Model
              <input
                type="file"
                accept=".json,.pnml,.xml"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  const reader = new FileReader();
                  reader.onload = (event) => {
                    try {
                      const text = event.target?.result as string;
                      const isPnml =
                        file.name.toLowerCase().endsWith('.pnml') ||
                        file.name.toLowerCase().endsWith('.xml');

                      let newNodes: any[];
                      let newEdges: any[];

                      if (isPnml) {
                        // Convert PNML → ReactFlow nodes/edges
                        ({ nodes: newNodes, edges: newEdges } = parsePnml(text));
                      } else {
                        // Standard JSON export format
                        ({ nodes: newNodes, edges: newEdges } = JSON.parse(text));
                      }

                      setNodes(newNodes);
                      setEdges(newEdges);
                      setInitialNodes(newNodes);
                      setInitialEdges(newEdges);
                      setSelectedExampleId('custom');
                      setLog([`Imported: ${file.name}`]);
                      setHistory([]);
                    } catch (err: any) {
                      alert(`Failed to import "${file.name}":\n${err?.message ?? err}`);
                    }
                  };
                  reader.readAsText(file);
                  // Reset input so the same file can be re-imported
                  e.target.value = '';
                }}
              />
            </label>
          </div>
          <select 
            value={selectedExampleId}
            onChange={(e) => loadExample(e.target.value)}
            className="bg-nord-1 border border-nord-3 text-nord-4 rounded px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-nord-8/50 transition-all cursor-pointer"
          >
            {examples.map((ex) => (
              <option key={ex.id} value={ex.id} className="bg-nord-1">{ex.name}</option>
            ))}
          </select>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden bg-nord-0">
        <aside className="w-64 border-r border-nord-1 bg-nord-0 p-6 flex flex-col gap-6 shadow-2xl z-10 transition-colors">
          <Toolbar 
            addPlace={addPlace} 
            addTransition={addTransition} 
            isPlaying={isPlaying} 
            onPlay={() => setIsPlaying(!isPlaying)} 
            onStep={handleStep}
            onStepBack={handleStepBack}
            onReset={handleReset}
            onClear={handleClear}
            showAnimations={showAnimations}
            onToggleAnimations={() => setShowAnimations(!showAnimations)}
            showProperties={showProperties}
            onToggleProperties={() => setShowProperties(!showProperties)}
            showMatrix={showMatrix}
            onToggleMatrix={() => setShowMatrix(!showMatrix)}
            historyCount={history.length}
            deadlock={deadlock}
          />
          <div className="flex-1 overflow-y-auto pt-4 border-t border-nord-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-nord-3 mb-2">Simulation Log</h3>
            <div className="space-y-1 text-[11px] text-nord-4 font-mono">
              {log.length === 0 && <span className="text-nord-3 italic opacity-50">Tracing system events...</span>}
              {log.map((l, i) => (
                <div key={i} className="animate-in fade-in slide-in-from-left-2 py-0.5 border-b border-nord-1 last:border-0">{l}</div>
              ))}
              {deadlock && log.length > 0 && <div className="text-nord-11 mt-4 p-2 bg-nord-11/10 border border-nord-11/20 rounded font-bold text-center">SYSTEM DEADLOCK</div>}
            </div>
          </div>
        </aside>

        <section className="flex-1 bg-nord-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#4c566a33_1px,transparent_1px),linear-gradient(to_bottom,#4c566a33_1px,transparent_1px)] bg-[size:40px_40px]"></div>
          <ReactFlowProvider>
            <PetriCanvas 
              nodes={nodes} 
              edges={edges} 
              setNodes={setNodes} 
              setEdges={setEdges} 
            />
          </ReactFlowProvider>
        </section>

        {showProperties && (
          <aside className="w-80 border-l border-nord-1 bg-nord-0 p-6 shadow-2xl z-10 overflow-y-auto transition-colors animate-in slide-in-from-right-8">
            <PropertiesPanel 
              selectedNodes={selectedNodes}
              selectedEdges={selectedEdges}
              setNodes={setNodes}
              setEdges={setEdges}
              netProps={netProps}
            />
          </aside>
        )}

        {showMatrix && (
          <aside className="w-[340px] border-l border-nord-1 bg-nord-0 p-6 shadow-2xl z-10 overflow-y-auto transition-colors animate-in slide-in-from-right-8">
            <MatrixPanel 
              places={places}
              transitions={transitions}
              arcs={arcs}
            />
          </aside>
        )}
      </main>
    </div>
  );
}
