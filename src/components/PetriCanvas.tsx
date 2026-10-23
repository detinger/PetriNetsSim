import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ReactFlow,
  Controls,
  ControlButton,
  MiniMap,
  NodeTypes,
  EdgeTypes,
  Connection,
  Edge,
  Node,
  NodeChange,
  EdgeChange,
  OnConnectEnd,
  applyNodeChanges,
  applyEdgeChanges,
  useReactFlow,
} from '@xyflow/react';
import { Map as MapIcon } from 'lucide-react';

import PlaceNode from './nodes/PlaceNode';
import TransitionNode from './nodes/TransitionNode';
import WeightedArc from './edges/WeightedArc';
import ConnectionLine from './edges/ConnectionLine';
import { useCanvas } from './CanvasContext';
import { useToast } from './ui';
import { ResolvedTheme } from '../lib/theme';
import { autoHandles, createArc, isAutoHandle, newId, NODE_SIZE, uniqueName } from '../lib/model';
// @ts-ignore
import '@xyflow/react/dist/style.css';

const nodeTypes: NodeTypes = {
  place: PlaceNode,
  transition: TransitionNode,
};

const edgeTypes: EdgeTypes = {
  weighted: WeightedArc,
};

const GRID = 10;
export const FIT_VIEW_OPTIONS = { padding: 0.15, maxZoom: 1.5 };
const snap = (v: number) => Math.round(v / GRID) * GRID;

export default function PetriCanvas({
  nodes,
  edges,
  setNodes,
  setEdges,
  colorMode,
  showMiniMap,
  onToggleMiniMap,
  onFire,
  onNodeCreated,
  onHoverEdge,
  onUndo,
}: {
  nodes: Node[];
  edges: Edge[];
  setNodes: React.Dispatch<React.SetStateAction<Node[]>>;
  setEdges: React.Dispatch<React.SetStateAction<Edge[]>>;
  colorMode: ResolvedTheme;
  showMiniMap: boolean;
  onToggleMiniMap: () => void;
  onFire: (transitionId: string) => void;
  onNodeCreated: (nodeId: string) => void;
  onHoverEdge: (edgeId: string | null) => void;
  onUndo: () => void;
}) {
  const { screenToFlowPosition } = useReactFlow();
  // Fit on mount only when there is something to fit; otherwise the first added node zooms to 200%
  const [fitOnMount] = useState(() => nodes.length > 0);
  const { isPlaying, enabledIds, recordUndo, setEditingEdgeId } = useCanvas();
  const toast = useToast();
  const reconnecting = useRef(false);

  const nodeById = useCallback((id: string) => nodes.find((n) => n.id === id), [nodes]);
  const nameOf = (node: Node) => (node.data?.name as string) || node.id;

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  // Arcs always join a place and a transition (C1); React Flow shows the result while dragging
  const isValidConnection = useCallback(
    (connection: Connection | Edge) => {
      const source = nodeById(connection.source);
      const target = nodeById(connection.target);
      return !!source && !!target && source.id !== target.id && source.type !== target.type;
    },
    [nodeById]
  );

  // Dropped on a node's body: use the sides that face each other (C3)
  const resolveHandles = (connection: Connection, source: Node, target: Node) =>
    !connection.sourceHandle || !connection.targetHandle || isAutoHandle(connection.sourceHandle) || isAutoHandle(connection.targetHandle)
      ? autoHandles(source, target)
      : { sourceHandle: connection.sourceHandle, targetHandle: connection.targetHandle };

  // A second arc between the same pair adds to the existing arc's weight (C7)
  const mergeInto = (existing: Edge, extra: number, source: Node, target: Node, removeId?: string) => {
    const weight = (Number(existing.data?.weight) || 1) + extra;
    setEdges((eds) =>
      eds
        .filter((e) => e.id !== removeId)
        .map((e) => (e.id === existing.id ? { ...e, data: { ...e.data, weight } } : e))
    );
    toast({
      message: `Arc ${nameOf(source)} → ${nameOf(target)} already exists; its weight is now ${weight}.`,
      action: { label: 'Undo', onClick: onUndo },
    });
  };

  const onConnect = useCallback(
    (connection: Connection) => {
      if (!isValidConnection(connection)) return;
      const source = nodeById(connection.source)!;
      const target = nodeById(connection.target)!;
      const existing = edges.find((e) => e.source === source.id && e.target === target.id);
      if (existing) {
        recordUndo('Increase arc weight');
        mergeInto(existing, 1, source, target);
        return;
      }
      recordUndo('Add arc');
      setEdges((eds) => [...eds, createArc(source, target, resolveHandles(connection, source, target))]);
    },
    [isValidConnection, nodeById, edges, recordUndo, setEdges]
  );

  // Moving an arc's end (C8)
  const onReconnect = useCallback(
    (oldEdge: Edge, connection: Connection) => {
      if (!isValidConnection(connection)) return;
      const source = nodeById(connection.source)!;
      const target = nodeById(connection.target)!;
      const handles = resolveHandles(connection, source, target);
      const duplicate = edges.find((e) => e.id !== oldEdge.id && e.source === source.id && e.target === target.id);
      recordUndo('Move arc');
      if (duplicate) {
        mergeInto(duplicate, Number(oldEdge.data?.weight) || 1, source, target, oldEdge.id);
        return;
      }
      setEdges((eds) =>
        eds.map((e) => (e.id === oldEdge.id ? { ...e, source: source.id, target: target.id, ...handles } : e))
      );
    },
    [isValidConnection, nodeById, edges, recordUndo, setEdges]
  );

  // Dropping on empty canvas creates the other kind of node and connects it (C6)
  const onConnectEnd: OnConnectEnd = useCallback(
    (event, state) => {
      if (reconnecting.current || state.isValid || isPlaying || !state.fromNode) return;
      const from = nodeById(state.fromNode.id);
      if (!from) return;

      if (state.toNode) {
        if (state.toNode.id !== from.id) {
          const kind = from.type === 'place' ? 'places' : 'transitions';
          toast({ tone: 'warning', message: `Arcs connect a place to a transition, so two ${kind} can't be joined directly.` });
        }
        return;
      }

      const element = event.target as Element | null;
      if (!element?.closest('.react-flow__pane') || element.closest('.react-flow__node, .react-flow__panel')) return;

      const point = 'changedTouches' in event ? event.changedTouches[0] : event;
      const position = screenToFlowPosition({ x: point.clientX, y: point.clientY });
      const type = from.type === 'place' ? 'transition' : 'place';
      const size = NODE_SIZE[type];
      const node: Node = {
        id: newId(type === 'place' ? 'p' : 't'),
        type,
        position: { x: snap(position.x - size.width / 2), y: snap(position.y - size.height / 2) },
        data: type === 'place' ? { name: uniqueName('p', nodes), tokens: 0 } : { name: uniqueName('t', nodes) },
        selected: true,
      };
      // Dragging from a target handle means the arc points into `from`
      const [source, target] = state.fromHandle?.type === 'target' ? [node, from] : [from, node];

      recordUndo(`Add ${type} and arc`);
      setNodes((nds) => [...nds.map((n) => (n.selected ? { ...n, selected: false } : n)), node]);
      setEdges((eds) => [...eds.map((e) => (e.selected ? { ...e, selected: false } : e)), createArc(source, target)]);
      onNodeCreated(node.id);
    },
    [isPlaying, nodeById, nodes, recordUndo, screenToFlowPosition, setNodes, setEdges, onNodeCreated, toast]
  );

  // Only a selected arc is drawn above the nodes, so its end anchors can be grabbed (C8).
  // React Flow's elevateEdgesOnSelect would also lift every arc of a selected node and
  // cover the neighbouring nodes' handles.
  const renderedEdges = useMemo(
    () => (edges.some((e) => e.selected) ? edges.map((e) => (e.selected ? { ...e, zIndex: 1001 } : e)) : edges),
    [edges]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={renderedEdges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onConnectEnd={onConnectEnd}
      onReconnect={onReconnect}
      onReconnectStart={() => (reconnecting.current = true)}
      onReconnectEnd={() => (reconnecting.current = false)}
      onBeforeDelete={async () => {
        if (isPlaying) return false;
        recordUndo('Delete');
        return true;
      }}
      onDelete={({ nodes: removedNodes, edges: removedEdges }) => {
        const count = removedNodes.length + removedEdges.length;
        if (!count) return;
        const what = count === 1 ? (removedNodes[0] ? nameOf(removedNodes[0]) : 'the arc') : `${count} elements`;
        toast({ message: `Deleted ${what}.`, action: { label: 'Undo', onClick: onUndo } });
      }}
      onNodeDragStart={() => recordUndo('Move')}
      onNodeDoubleClick={(_, node) => {
        if (node.type !== 'transition' || isPlaying) return;
        if (enabledIds.has(node.id)) onFire(node.id);
        else toast({ message: `${nameOf(node)} isn't enabled: its input places don't hold enough tokens.` });
      }}
      onEdgeDoubleClick={(_, edge) => !isPlaying && setEditingEdgeId(edge.id)}
      onEdgeMouseEnter={(_, edge) => onHoverEdge(edge.id)}
      onEdgeMouseLeave={() => onHoverEdge(null)}
      isValidConnection={isValidConnection}
      connectionLineComponent={ConnectionLine}
      connectionRadius={24}
      reconnectRadius={12}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      colorMode={colorMode}
      nodesDraggable={!isPlaying}
      nodesConnectable={!isPlaying}
      edgesReconnectable={!isPlaying}
      deleteKeyCode={isPlaying ? null : ['Backspace', 'Delete']}
      panActivationKeyCode={null}
      zoomOnDoubleClick={false}
      snapToGrid
      snapGrid={[GRID, GRID]}
      fitView={fitOnMount}
      fitViewOptions={FIT_VIEW_OPTIONS}
      defaultEdgeOptions={{
        type: 'weighted',
        data: { weight: 1 }
      }}
    >
      <Controls position="bottom-left" showInteractive={false}>
        <ControlButton
          onClick={onToggleMiniMap}
          aria-label={showMiniMap ? 'Hide mini-map' : 'Show mini-map'}
          title={showMiniMap ? 'Hide mini-map' : 'Show mini-map'}
          aria-pressed={showMiniMap}
          className={showMiniMap ? 'is-active' : undefined}
        >
          <MapIcon />
        </ControlButton>
      </Controls>
      {showMiniMap && (
        <MiniMap
          pannable
          zoomable
          position="bottom-right"
          ariaLabel="Mini-map"
          nodeClassName={(node) => (node.type === 'place' ? 'mm-place' : enabledIds.has(node.id) ? 'mm-transition mm-enabled' : 'mm-transition')}
          nodeStrokeWidth={3}
        />
      )}
    </ReactFlow>
  );
}
