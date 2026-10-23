import { useState, useCallback, useEffect, useMemo, useRef, KeyboardEvent } from 'react';
import { ReactFlowProvider, Node, Edge, useNodesState, useEdgesState, useReactFlow } from '@xyflow/react';
import {
  AlertTriangle,
  Download,
  Grid3x3,
  Monitor,
  Moon,
  Network,
  ScrollText,
  SlidersHorizontal,
  Sun,
  Upload,
  Workflow,
} from 'lucide-react';
import PetriCanvas, { FIT_VIEW_OPTIONS } from './components/PetriCanvas';
import BrandMark from './components/BrandMark';
import Toolbar from './components/panels/Toolbar';
import SimulationOverlay from './components/SimulationOverlay';
import PropertiesPanel from './components/panels/PropertiesPanel';
import MatrixPanel from './components/panels/MatrixPanel';
import ReachabilityPanel from './components/panels/ReachabilityPanel';
import LogPanel from './components/panels/LogPanel';
import { CanvasContext, CanvasContextValue, FiringFlash, UndoOptions } from './components/CanvasContext';
import { ChoiceMenu, Dialog, Kbd, ToastProvider, useToast } from './components/ui';
import { examples } from './examples/library';
import { getEnabledTransitions, fireTransition } from './lib/petrinet';
import { analyzeNet } from './lib/analysis';
import { LogEntry, NetPlace, NetTransition, NetArc } from './lib/types';
import { parsePnml } from './lib/pnmlParser';
import { ThemePreference, useTheme } from './lib/theme';
import { isActivationTarget, isTypingTarget, SHORTCUT_GROUPS } from './lib/shortcuts';
import {
  applyMarking,
  Marking,
  markingOf,
  newId,
  NODE_SIZE,
  nodeCenter,
  normalizeModel,
  pickSides,
  sameMarking,
  stripForExport,
  uniqueName,
} from './lib/model';

type InspectorTab = 'properties' | 'matrices' | 'reachability' | 'log';

const inspectorTabs: { id: InspectorTab; label: string; icon: typeof SlidersHorizontal }[] = [
  { id: 'properties', label: 'Properties', icon: SlidersHorizontal },
  { id: 'matrices', label: 'Matrices', icon: Grid3x3 },
  { id: 'reachability', label: 'Reachability', icon: Network },
  { id: 'log', label: 'Log', icon: ScrollText },
];

const themeOptions: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'Match system', icon: Monitor },
];

interface UndoEntry {
  label: string;
  nodes: Node[];
  edges: Edge[];
  markingIds: string[];
  key?: string;
  time: number;
}

const UNDO_LIMIT = 100;
const COALESCE_MS = 1500;

const firstModel = normalizeModel(examples[0].nodes, examples[0].edges);

export default function App() {
  return (
    <ToastProvider>
      <ReactFlowProvider>
        <Editor />
      </ReactFlowProvider>
    </ToastProvider>
  );
}

function Editor() {
  const [nodes, setNodes] = useNodesState<Node>(firstModel.nodes);
  const [edges, setEdges] = useEdgesState<Edge>(firstModel.edges);
  const [initialMarking, setInitialMarking] = useState<Marking>(() => markingOf(firstModel.nodes));

  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showAnimations, setShowAnimations] = useState(true);
  const [speed, setSpeed] = useState(800);
  const [log, setLog] = useState<LogEntry[]>([]);
  // Each step stores the marking before it fired, so stepping back never undoes edits
  const [history, setHistory] = useState<{ marking: Marking; log: LogEntry[] }[]>([]);
  const [firing, setFiring] = useState<{ edgeIds: Set<string>; key: number }>({ edgeIds: new Set(), key: 0 });
  const [firingTransitionId, setFiringTransitionId] = useState<string | null>(null);
  const [flash, setFlash] = useState<FiringFlash | null>(null);
  const [undoState, setUndoState] = useState<{ past: UndoEntry[]; future: UndoEntry[] }>({ past: [], future: [] });

  const [selectedExampleId, setSelectedExampleId] = useState(examples[0].id);
  const [showInspector, setShowInspector] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('properties');
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [focusNameId, setFocusNameId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);
  const [editingEdgeId, setEditingEdgeId] = useState<string | null>(null);

  const { preference: themePreference, resolved: theme, choose: chooseTheme } = useTheme();
  const { screenToFlowPosition, fitView, deleteElements } = useReactFlow();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const timers = useRef<number[]>([]);

  // Latest values for callbacks that outlive a render (timers, toasts, key handlers)
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  const edgesRef = useRef(edges);
  edgesRef.current = edges;
  const logRef = useRef(log);
  logRef.current = log;
  const undoRef = useRef(undoState);
  const animatingRef = useRef(isAnimating);
  animatingRef.current = isAnimating;

  // Derived Petri Net state with useMemo to ensure stable references
  const { places, transitions, arcs, enabledTransitions, enabledIds, deadlock } = useMemo(() => {
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

    return {
      places: p,
      transitions: t,
      arcs: a,
      enabledTransitions: et,
      enabledIds: new Set(et.map((x) => x.id)),
      deadlock: t.length > 0 && et.length === 0,
    };
  }, [nodes, edges]);

  const currentMarking = useMemo(() => markingOf(nodes), [nodes]);

  // Before the first step, the initial marking follows every token edit
  useEffect(() => {
    if (history.length === 0 && !isAnimating) {
      setInitialMarking((prev) => (sameMarking(prev, currentMarking) ? prev : currentMarking));
    }
  }, [currentMarking, history.length, isAnimating]);

  // Analysis depends only on structure and M₀, not on positions, names or the current marking
  const initialVector = places.map((p) => initialMarking[p.id] ?? p.tokens);
  const analysisKey = JSON.stringify([
    places.map((p) => p.id),
    transitions.map((t) => t.id),
    arcs.map((a) => [a.source, a.target, a.weight]),
    initialVector,
  ]);
  const analysis = useMemo(
    () => (places.length + transitions.length === 0 ? null : analyzeNet(places, transitions, arcs, initialVector)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [analysisKey]
  );

  // Two-way arcs that share both endpoints are drawn side by side (C9).
  // Uses live node centers (same logic as WeightedArc) so the offset is applied
  // consistently after nodes are moved.
  const overlappingEdgeIds = useMemo(() => {
    const nodeById = new Map(nodes.map((n) => [n.id, n]));
    const liveSides = (sourceId: string, targetId: string) => {
      const s = nodeById.get(sourceId);
      const t = nodeById.get(targetId);
      if (!s || !t) return null;
      const { sourceSide, targetSide } = pickSides(nodeCenter(s), nodeCenter(t));
      return `${sourceId}|${sourceSide}|${targetId}|${targetSide}`;
    };
    const keys = new Set(edges.map((e) => liveSides(e.source, e.target)).filter(Boolean));
    return new Set(
      edges.filter((e) => keys.has(liveSides(e.target, e.source))).map((e) => e.id)
    );
  }, [edges, nodes]);

  const nameOf = useCallback(
    (id: string) => (nodesRef.current.find((n) => n.id === id)?.data?.name as string) || id,
    // Names change with nodes; re-create so panels re-render with the new names
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [nodes]
  );

  /* ── Undo / redo for edits (S7) ─────────────────────────────────────────── */

  const setUndo = (next: { past: UndoEntry[]; future: UndoEntry[] }) => {
    undoRef.current = next;
    setUndoState(next);
  };

  const recordUndo = useCallback((label: string, options: UndoOptions = {}) => {
    const { past } = undoRef.current;
    const top = past[past.length - 1];
    const now = Date.now();
    if (options.key && top?.key === options.key && now - top.time < COALESCE_MS) {
      setUndo({ past: [...past.slice(0, -1), { ...top, time: now }], future: [] });
      return;
    }
    const entry: UndoEntry = {
      label,
      nodes: nodesRef.current,
      edges: edgesRef.current,
      markingIds: options.markingIds ?? [],
      key: options.key,
      time: now,
    };
    setUndo({ past: [...past, entry].slice(-UNDO_LIMIT), future: [] });
  }, []);

  // Structure comes back from the snapshot; token counts only for places the edit changed
  const restoreSnapshot = (snapshot: { nodes: Node[]; edges: Edge[] }, markingIds: string[]) => {
    const tokensNow = markingOf(nodesRef.current);
    setNodes(
      snapshot.nodes.map((n) => {
        const { dragging, ...node } = n;
        if (node.type !== 'place' || markingIds.includes(node.id) || !(node.id in tokensNow)) return node;
        return tokensNow[node.id] === node.data.tokens ? node : { ...node, data: { ...node.data, tokens: tokensNow[node.id] } };
      })
    );
    setEdges(snapshot.edges);
    setEditingEdgeId(null);
  };

  const undo = useCallback(() => {
    const { past, future } = undoRef.current;
    const entry = past[past.length - 1];
    if (!entry || animatingRef.current) return;
    const current: UndoEntry = { ...entry, nodes: nodesRef.current, edges: edgesRef.current, key: undefined };
    setUndo({ past: past.slice(0, -1), future: [...future, current] });
    restoreSnapshot(entry, entry.markingIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redo = useCallback(() => {
    const { past, future } = undoRef.current;
    const entry = future[future.length - 1];
    if (!entry || animatingRef.current) return;
    const current: UndoEntry = { ...entry, nodes: nodesRef.current, edges: edgesRef.current, key: undefined, time: Date.now() };
    setUndo({ past: [...past, current], future: future.slice(0, -1) });
    restoreSnapshot(entry, entry.markingIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Simulation ─────────────────────────────────────────────────────────── */

  const phaseMs = Math.min(300, Math.round(speed * 0.35));

  const cancelAnimation = useCallback(() => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
    setFiring((f) => (f.edgeIds.size ? { edgeIds: new Set(), key: f.key } : f));
    animatingRef.current = false;
    setIsAnimating(false);
  }, []);

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      timers.current = timers.current.filter((t) => t !== id);
      fn();
    }, ms);
    timers.current.push(id);
  };

  const fire = (transitionId: string) => {
    const transition = transitions.find((t) => t.id === transitionId);
    if (!transition || !enabledIds.has(transitionId) || animatingRef.current) return;

    const before = markingOf(nodesRef.current);
    const after: Marking = {};
    for (const p of fireTransition(places, transitions, arcs, transitionId, enabledTransitions)) after[p.id] = p.tokens;
    const entry: LogEntry = {
      step: history.length + 1,
      transitionId,
      transitionName: transition.name,
      time: Date.now(),
      marking: after,
    };
    const changedPlaces = new Set(places.filter((p) => before[p.id] !== after[p.id]).map((p) => p.id));

    setHistory((h) => [...h, { marking: before, log: logRef.current }]);

    const finish = () => {
      setNodes((nds) => applyMarking(nds, after));
      setLog((l) => [...l, entry]);
      setFlash({ key: Date.now(), transitionId, placeIds: changedPlaces });
    };

    if (!showAnimations) {
      finish();
      return;
    }

    // Animated firing: consume, move along input arcs, then output arcs, then produce
    const consumed: Marking = {};
    for (const p of places) {
      const taken = arcs.filter((a) => a.source === p.id && a.target === transitionId).reduce((sum, a) => sum + a.weight, 0);
      if (taken) consumed[p.id] = before[p.id] - taken;
    }
    const inArcIds = edges.filter((e) => e.target === transitionId).map((e) => e.id);
    const outArcIds = edges.filter((e) => e.source === transitionId).map((e) => e.id);

    animatingRef.current = true;
    setIsAnimating(true);
    setFiringTransitionId(transitionId);
    setNodes((nds) => applyMarking(nds, consumed));
    setFiring((f) => ({ edgeIds: new Set(inArcIds), key: f.key + 1 }));
    schedule(() => setFiring((f) => ({ edgeIds: new Set(outArcIds), key: f.key + 1 })), phaseMs);
    schedule(() => {
      setFiring((f) => ({ edgeIds: new Set(), key: f.key }));
      setFiringTransitionId(null);
      finish();
      animatingRef.current = false;
      setIsAnimating(false);
    }, phaseMs * 2);
  };

  const handleStep = () => {
    if (animatingRef.current) return;
    if (enabledTransitions.length === 0) {
      setIsPlaying(false);
      return;
    }
    fire(enabledTransitions[Math.floor(Math.random() * enabledTransitions.length)].id);
  };

  const stepRef = useRef(handleStep);
  stepRef.current = handleStep;

  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => stepRef.current(), speed);
    return () => window.clearInterval(interval);
  }, [isPlaying, speed]);

  useEffect(() => {
    if (isPlaying && deadlock && !isAnimating) {
      setIsPlaying(false);
      toast({
        tone: 'warning',
        title: 'Simulation stopped',
        message: `Deadlock after ${history.length} ${history.length === 1 ? 'step' : 'steps'}: no transition is enabled.`,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, deadlock, isAnimating]);

  const handleStepBack = () => {
    if (history.length === 0) return;
    cancelAnimation();
    const last = history[history.length - 1];
    setNodes((nds) => applyMarking(nds, last.marking));
    setLog(last.log);
    setHistory((h) => h.slice(0, -1));
    setFlash(null);
  };

  const handleReset = () => {
    cancelAnimation();
    setIsPlaying(false);
    setNodes((nds) => applyMarking(nds, initialMarking));
    setHistory([]);
    setLog([]);
    setFlash(null);
  };

  /* ── Editing ────────────────────────────────────────────────────────────── */

  const loadModel = (rawNodes: any[], rawEdges: any[], id: string) => {
    cancelAnimation();
    setIsPlaying(false);
    const model = normalizeModel(rawNodes, rawEdges);
    setNodes(model.nodes);
    setEdges(model.edges);
    setInitialMarking(markingOf(model.nodes));
    setHistory([]);
    setLog([]);
    setFlash(null);
    setSelectedExampleId(id);
    setEditingEdgeId(null);
    setUndo({ past: [], future: [] });
    // fitView waits until the new nodes have been measured
    window.setTimeout(() => fitView({ ...FIT_VIEW_OPTIONS, duration: 200 }), 0);
  };

  const loadExample = (id: string) => {
    const ex = examples.find((e) => e.id === id);
    if (ex) loadModel(ex.nodes, ex.edges, id);
  };

  const handleClear = () => {
    recordUndo('Clear canvas');
    cancelAnimation();
    setIsPlaying(false);
    setNodes([]);
    setEdges([]);
    setHistory([]);
    setLog([]);
    setFlash(null);
    setSelectedExampleId('empty');
    setConfirmClear(false);
    toast({ message: 'Canvas cleared.', action: { label: 'Undo', onClick: undo } });
  };

  // New nodes appear in the middle of the visible canvas, nudged off existing ones (C11)
  const addNode = (type: 'place' | 'transition') => {
    if (isPlaying) return;
    const rect = document.getElementById('canvas')?.getBoundingClientRect();
    const center = rect
      ? screenToFlowPosition({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
      : { x: 200, y: 200 };
    const size = NODE_SIZE[type];
    let position = { x: Math.round((center.x - size.width / 2) / 10) * 10, y: Math.round((center.y - size.height / 2) / 10) * 10 };
    const occupied = (p: { x: number; y: number }) =>
      nodesRef.current.some((n) => Math.abs(n.position.x - p.x) < 40 && Math.abs(n.position.y - p.y) < 40);
    for (let i = 0; i < 12 && occupied(position); i++) position = { x: position.x + 40, y: position.y + 30 };

    const node: Node = {
      id: newId(type === 'place' ? 'p' : 't'),
      type,
      position,
      data: type === 'place' ? { name: uniqueName('p', nodesRef.current), tokens: 0 } : { name: uniqueName('t', nodesRef.current) },
      selected: true,
    };
    recordUndo(type === 'place' ? 'Add place' : 'Add transition');
    setNodes((nds) => [...nds.map((n) => (n.selected ? { ...n, selected: false } : n)), node]);
    setEdges((eds) => (eds.some((e) => e.selected) ? eds.map((e) => (e.selected ? { ...e, selected: false } : e)) : eds));
  };

  const onNodeCreated = useCallback((id: string) => {
    setInspectorTab('properties');
    // The mouseup that ended the drag also clicks the pane, which clears the selection;
    // select the new node again once that click has been handled
    window.setTimeout(() => {
      setNodes((nds) => nds.map((n) => (n.selected === (n.id === id) ? n : { ...n, selected: n.id === id })));
      setEdges((eds) => (eds.some((e) => e.selected) ? eds.map((e) => (e.selected ? { ...e, selected: false } : e)) : eds));
      setFocusNameId(id);
    }, 0);
  }, [setNodes, setEdges]);

  const updateNodeData = (id: string, data: Record<string, unknown>, label: string, options?: UndoOptions) => {
    recordUndo(label, options);
    setNodes((nds) => nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...data } } : n)));
  };

  const updateEdgeData = (id: string, data: Record<string, unknown>, label: string, options?: UndoOptions) => {
    recordUndo(label, options);
    setEdges((eds) => eds.map((e) => (e.id === id ? { ...e, data: { ...e.data, ...data } } : e)));
  };

  const setTokens = (placeIds: string[], tokens: number) => {
    recordUndo('Change tokens', { markingIds: placeIds });
    setNodes((nds) => nds.map((n) => (placeIds.includes(n.id) ? { ...n, data: { ...n.data, tokens } } : n)));
  };

  const commitWeight = useCallback(
    (edgeId: string, weight: number) => {
      recordUndo('Change weight', { key: `weight:${edgeId}` });
      setEdges((eds) => eds.map((e) => (e.id === edgeId ? { ...e, data: { ...e.data, weight } } : e)));
    },
    [recordUndo, setEdges]
  );

  /* ── Import / export ────────────────────────────────────────────────────── */

  const handleExport = () => {
    try {
      const data = JSON.stringify({
        ...stripForExport(nodes, edges),
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
          .then(async (writable: any) => {
            await writable.write(data);
            await writable.close();
            toast({ tone: 'success', message: `Saved ${fileName}.` });
          })
          .catch((err: any) => {
            if (err.name === 'AbortError') return;
            console.error(err);
            toast({ tone: 'error', title: 'Export failed', message: 'The model could not be saved. Try again or choose another folder.' });
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
        toast({ tone: 'success', message: `Downloaded ${fileName}.` });
      }
    } catch (err) {
      console.error(err);
      toast({ tone: 'error', title: 'Export failed', message: 'The model could not be converted to JSON.' });
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        if (!Array.isArray(newNodes) || !Array.isArray(newEdges)) {
          throw new Error('The file has no "nodes" and "edges" lists.');
        }

        loadModel(newNodes, newEdges, 'custom');
        toast({ tone: 'success', message: `Imported ${file.name}.` });
      } catch (err: any) {
        toast({
          tone: 'error',
          title: `Couldn't import ${file.name}`,
          message: `${String(err?.message ?? err).replace(/\.$/, '')}. Choose a JSON file exported from this app or a PNML file.`,
          duration: 9000,
        });
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be re-imported
    e.target.value = '';
  };

  /* ── Keyboard ───────────────────────────────────────────────────────────── */

  const keyActions = useRef<(e: globalThis.KeyboardEvent) => void>(() => {});
  keyActions.current = (e) => {
    if (e.defaultPrevented || confirmClear || showShortcuts || isTypingTarget(e.target)) return;
    const mod = e.metaKey || e.ctrlKey;
    const key = e.key.toLowerCase();

    if (mod && key === 'z') {
      e.preventDefault();
      if (isPlaying) return;
      if (e.shiftKey) redo();
      else undo();
      return;
    }
    if (mod && key === 'y') {
      e.preventDefault();
      if (!isPlaying) redo();
      return;
    }
    if (mod || e.altKey) return;

    if (e.key === ' ' && !isActivationTarget(e.target)) {
      e.preventDefault();
      if (e.shiftKey) {
        if (!deadlock || isPlaying) setIsPlaying((p) => !p);
      } else if (!isPlaying) {
        handleStep();
      }
      return;
    }
    if (e.key === '?') {
      setShowShortcuts(true);
      return;
    }
    switch (key) {
      case 'p':
        addNode('place');
        break;
      case 't':
        addNode('transition');
        break;
      case 'r':
        handleReset();
        break;
      case 'b':
        if (!isPlaying) handleStepBack();
        break;
      case 'i':
        setShowInspector((s) => !s);
        break;
      default:
        return;
    }
    e.preventDefault();
  };

  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => keyActions.current(e);
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Arrow keys move between inspector tabs (WAI-ARIA tabs pattern)
  const onTabKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const index = inspectorTabs.findIndex((t) => t.id === inspectorTab);
    const step = e.key === 'ArrowRight' ? 1 : -1;
    const next = inspectorTabs[(index + step + inspectorTabs.length) % inspectorTabs.length];
    setInspectorTab(next.id);
    document.getElementById(`tab-${next.id}`)?.focus();
  };

  const selectedNodes = nodes.filter((n) => n.selected);
  const selectedEdges = edges.filter((e) => e.selected);
  const selectedIds = useMemo(
    () => new Set([...selectedNodes, ...selectedEdges].map((x) => x.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selectedNodes.map((n) => n.id).join(), selectedEdges.map((e) => e.id).join()]
  );
  const isKnownExample = examples.some((ex) => ex.id === selectedExampleId);
  const undoTop = undoState.past[undoState.past.length - 1];
  const redoTop = undoState.future[undoState.future.length - 1];

  const canvasContext: CanvasContextValue = {
    isPlaying,
    enabledIds,
    firingEdgeIds: firing.edgeIds,
    firingKey: firing.key,
    firingMs: phaseMs,
    firingTransitionId,
    flash,
    overlappingEdgeIds,
    hoveredEdgeId,
    editingEdgeId,
    setEditingEdgeId,
    commitWeight,
    recordUndo,
  };

  return (
    <div className="flex h-full flex-col bg-app text-fg">
      <a href="#canvas" className="skip-link">Skip to canvas</a>

      <header className="flex min-h-14 shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line bg-elevated px-4 py-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <BrandMark />
          <div className="min-w-0 leading-tight">
            <h1 className="text-[15px] font-[650]">Petri Nets Simulator</h1>
            <p className="truncate text-[11px] text-fg-subtle max-md:hidden">
              Model, simulate, and analyze place/transition nets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2">
            <span className="field-label max-lg:sr-only">Example</span>
            <select
              value={isKnownExample ? selectedExampleId : ''}
              onChange={(e) => loadExample(e.target.value)}
              className="select w-56 max-sm:w-40"
            >
              {!isKnownExample && <option value="" disabled>Custom model</option>}
              {examples.map((ex) => (
                <option key={ex.id} value={ex.id}>{ex.name}</option>
              ))}
            </select>
          </label>
          <button
            type="button"
            className="btn"
            onClick={() => fileInputRef.current?.click()}
            title="Import a JSON or PNML model"
          >
            <Upload />
            <span className="max-md:sr-only">Import</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,.pnml,.xml"
            className="hidden"
            onChange={handleImport}
          />
          <button type="button" className="btn" onClick={handleExport} title="Download the model as JSON">
            <Download />
            <span className="max-md:sr-only">Export</span>
          </button>
          <ChoiceMenu
            label="Theme"
            value={themePreference}
            options={themeOptions}
            onChange={chooseTheme}
            trigger={themePreference === 'system' ? <Monitor /> : theme === 'dark' ? <Moon /> : <Sun />}
          />
        </div>
      </header>

      <Toolbar
        addPlace={() => addNode('place')}
        addTransition={() => addNode('transition')}
        isPlaying={isPlaying}
        isAnimating={isAnimating}
        onPlay={() => setIsPlaying(!isPlaying)}
        onStep={handleStep}
        onStepBack={handleStepBack}
        onReset={handleReset}
        onClear={() => setConfirmClear(true)}
        onUndo={undo}
        onRedo={redo}
        undoLabel={undoTop?.label ?? null}
        redoLabel={redoTop?.label ?? null}
        speed={speed}
        onSpeedChange={setSpeed}
        showAnimations={showAnimations}
        onToggleAnimations={() => setShowAnimations(!showAnimations)}
        showInspector={showInspector}
        onToggleInspector={() => setShowInspector(!showInspector)}
        onShowShortcuts={() => setShowShortcuts(true)}
        historyCount={history.length}
        deadlock={deadlock}
        isEmpty={nodes.length === 0}
      />

      <CanvasContext.Provider value={canvasContext}>
        <main className={showInspector ? 'workspace' : 'workspace workspace-full'}>
          <section id="canvas" tabIndex={-1} aria-label="Petri net canvas" className="relative min-h-0 min-w-0 bg-canvas outline-none focus-visible:shadow-none">
            <PetriCanvas
              nodes={nodes}
              edges={edges}
              setNodes={setNodes}
              setEdges={setEdges}
              colorMode={theme}
              showMiniMap={showMiniMap}
              onToggleMiniMap={() => setShowMiniMap((s) => !s)}
              onFire={fire}
              onNodeCreated={onNodeCreated}
              onHoverEdge={setHoveredEdgeId}
              onUndo={undo}
            />

            {transitions.length > 0 && (
              <>
                {/* Centered simulation overlay (token simulation mode indicator) */}
                <SimulationOverlay
                  isPlaying={isPlaying}
                  isAnimating={isAnimating}
                  stepCount={history.length}
                  recentLog={log}
                  deadlock={deadlock}
                  enabledCount={enabledTransitions.length}
                />
                {/* Top-left status badges for non-simulation states */}
                {!isPlaying && !isAnimating && (
                  <div className="pointer-events-none absolute left-3 top-3 z-[15] flex flex-wrap gap-1.5" aria-live="polite">
                    {deadlock ? (
                      <span className="badge badge-error">
                        <AlertTriangle aria-hidden="true" /> Deadlock
                      </span>
                    ) : (
                      <span className="badge badge-accent">
                        {enabledTransitions.length} enabled
                      </span>
                    )}
                  </div>
                )}
              </>
            )}

            {nodes.length === 0 && (
              <div className="pointer-events-none absolute inset-0 z-[15] flex items-center justify-center p-4">
                <div className="empty-state card pointer-events-auto max-w-sm">
                  <Workflow aria-hidden="true" />
                  <h4>The canvas is empty</h4>
                  <p>
                    Add a place (<Kbd keys="P" />) or a transition (<Kbd keys="T" />), or choose an example. Then drag
                    from a dot on a node’s edge to connect it, or drop on empty space to create the next element.
                  </p>
                </div>
              </div>
            )}
          </section>

          {showInspector && (
            <aside className="inspector" aria-label="Inspector">
              <div className="tabs px-3" role="tablist" aria-label="Inspector views">
                {inspectorTabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    id={`tab-${id}`}
                    type="button"
                    role="tab"
                    className="tab"
                    aria-selected={inspectorTab === id}
                    aria-controls={`panel-${id}`}
                    tabIndex={inspectorTab === id ? 0 : -1}
                    onClick={() => setInspectorTab(id)}
                    onKeyDown={onTabKeyDown}
                  >
                    <Icon aria-hidden="true" />
                    {label}
                    {id === 'log' && log.length > 0 && <span className="badge">{log.length}</span>}
                  </button>
                ))}
              </div>

              <div
                id={`panel-${inspectorTab}`}
                role="tabpanel"
                aria-labelledby={`tab-${inspectorTab}`}
                className="min-h-0 flex-1 overflow-y-auto p-4"
              >
                {inspectorTab === 'properties' && (
                  <PropertiesPanel
                    selectedNodes={selectedNodes}
                    selectedEdges={selectedEdges}
                    analysis={analysis}
                    enabledIds={enabledIds}
                    isPlaying={isPlaying}
                    nameOf={nameOf}
                    focusNameId={focusNameId}
                    onFocusedName={() => setFocusNameId(null)}
                    updateNodeData={updateNodeData}
                    updateEdgeData={updateEdgeData}
                    setTokens={setTokens}
                    onDelete={(n, e) => deleteElements({ nodes: n, edges: e })}
                    onFire={fire}
                  />
                )}

                {inspectorTab === 'matrices' && (
                  <MatrixPanel
                    places={places}
                    transitions={transitions}
                    arcs={arcs}
                    enabledIds={enabledIds}
                    initialMarking={initialMarking}
                    selectedIds={selectedIds}
                  />
                )}

                {inspectorTab === 'reachability' && (
                  <ReachabilityPanel
                    analysis={analysis}
                    placeNames={places.map((p) => p.name)}
                    currentMarking={places.map((p) => p.tokens)}
                    nameOf={nameOf}
                  />
                )}

                {inspectorTab === 'log' && <LogPanel log={log} places={places} deadlock={deadlock} />}
              </div>
            </aside>
          )}
        </main>
      </CanvasContext.Provider>

      <Dialog
        open={confirmClear}
        title="Clear the canvas?"
        size="sm"
        onClose={() => setConfirmClear(false)}
        footer={
          <>
            <button type="button" className="btn" onClick={() => setConfirmClear(false)} data-autofocus>
              Cancel
            </button>
            <button type="button" className="btn btn-danger" onClick={handleClear}>
              Clear canvas
            </button>
          </>
        }
      >
        <p className="m-0">
          This removes {places.length} {places.length === 1 ? 'place' : 'places'}, {transitions.length}{' '}
          {transitions.length === 1 ? 'transition' : 'transitions'} and {edges.length} {edges.length === 1 ? 'arc' : 'arcs'},
          and ends the current simulation. You can undo it afterwards.
        </p>
      </Dialog>

      <Dialog open={showShortcuts} title="Keyboard shortcuts" onClose={() => setShowShortcuts(false)}>
        <div className="grid gap-5 sm:grid-cols-2">
          {SHORTCUT_GROUPS.map((group) => (
            <section key={group.title}>
              <h3 className="eyebrow mb-2">{group.title}</h3>
              <dl className="m-0">
                {group.items.map(({ keys, description }) => (
                  <div key={keys + description} className="flex items-center justify-between gap-3 border-t border-line py-1.5 first:border-t-0">
                    <dt className="text-[13px]">{description}</dt>
                    <dd className="m-0 shrink-0"><Kbd keys={keys} /></dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </Dialog>
    </div>
  );
}
