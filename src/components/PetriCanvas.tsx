import { useCallback } from 'react';
import {
  ReactFlow,

  Controls,
  NodeTypes,
  EdgeTypes,
  addEdge,
  Connection,
  Edge,
  NodeChange,
  EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from '@xyflow/react';

import PlaceNode from './nodes/PlaceNode';
import TransitionNode from './nodes/TransitionNode';
import WeightedArc from './edges/WeightedArc';
// @ts-ignore
import '@xyflow/react/dist/style.css';

const nodeTypes: NodeTypes = {
  place: PlaceNode,
  transition: TransitionNode,
};

const edgeTypes: EdgeTypes = {
  weighted: WeightedArc,
};

export default function PetriCanvas({
  nodes,
  edges,
  setNodes,
  setEdges,
}: {
  nodes: any[];
  edges: any[];
  setNodes: any;
  setEdges: any;
}) {
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes((nds: any) => applyNodeChanges(changes, nds)),
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges((eds: any) => applyEdgeChanges(changes, eds)),
    [setEdges]
  );

  const onConnect = useCallback(
    (params: Connection) => {
      // Find source and target node types
      const sourceNode = nodes.find((n) => n.id === params.source);
      const targetNode = nodes.find((n) => n.id === params.target);

      if (!sourceNode || !targetNode || sourceNode.type === targetNode.type) {
        // Prevent Place->Place or Transition->Transition by default
        return;
      }

      const newEdge: Edge = {
        ...params,
        id: `e-${params.source}-${params.target}-${Date.now()}`,
        type: 'weighted',
        markerEnd: { type: 'arrowclosed' as any, color: '#2e3440' },
        data: { weight: 1 },
      };

      setEdges((eds: any) => addEdge(newEdge, eds));
    },
    [nodes, setEdges]
  );

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      className="bg-[#d8dee9]"
      defaultEdgeOptions={{
        type: 'weighted',
        style: { strokeWidth: 3 },
        data: { weight: 1 }
      }}
    >
      <Controls className="bg-nord-4 border-nord-3 fill-nord-0 shadow-lg" />
    </ReactFlow>
  );
}
