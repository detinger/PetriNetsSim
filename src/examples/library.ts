import { PetriNetExample } from '../lib/types';
import { MarkerType } from '@xyflow/react';

const defaultMarker = {
  type: MarkerType.ArrowClosed,
  color: '#2e3440',
};

// HELPER: Generate edge with explicit handle IDs for professional look
const edge = (id: string, source: string, target: string, sourceHandle: string, targetHandle: string, curvature = 0.75) => ({
  id,
  source,
  target,
  sourceHandle,
  targetHandle,
  type: 'weighted',
  markerEnd: defaultMarker,
  data: { weight: 1, curvature }
});

// 1. Producer-Consumer (Mathematically Aligned)
export const producerConsumer: PetriNetExample = {
  id: 'producer-consumer',
  name: 'Producer-Consumer',
  description: 'Linear pipeline with split-join buffer control.',
  places: [], transitions: [], arcs: [],
  nodes: [
    { id: 'p1', type: 'place', position: { x: 100, y: 300 }, data: { name: 'p_ready', tokens: 1 } },
    { id: 't1', type: 'transition', position: { x: 250, y: 300 }, data: { name: 't_produce' } },
    { id: 'p2', type: 'place', position: { x: 400, y: 200 }, data: { name: 'p_buffer', tokens: 5 } },
    { id: 'p3', type: 'place', position: { x: 400, y: 400 }, data: { name: 'p_items', tokens: 0 } },
    { id: 't2', type: 'transition', position: { x: 550, y: 300 }, data: { name: 't_consume' } },
    { id: 'p4', type: 'place', position: { x: 700, y: 300 }, data: { name: 'p_cons_rdy', tokens: 1 } },
  ],
  edges: [
    edge('a1', 'p1', 't1', 'source-right', 'target-left'),
    edge('a2', 't1', 'p1', 'source-left', 'target-left', 1.8),
    edge('a3', 'p2', 't1', 'source-right', 'target-right', 0.5),
    edge('a4', 't1', 'p3', 'source-right', 'target-left', 0.5),
    edge('a5', 'p3', 't2', 'source-right', 'target-left', 0.5),
    edge('a6', 'p4', 't2', 'source-left', 'target-right'),
    edge('a7', 't2', 'p4', 'source-right', 'target-right', 1.8),
    edge('a8', 't2', 'p2', 'source-left', 'target-right', 0.5),
  ],
};

// 2. Dining Philosophers (Geometric Triangle)
export const diningPhilosophers: PetriNetExample = {
  id: 'dining-philosophers',
  name: 'Dining Philosophers (3)',
  description: 'Radically balanced resource sharing model.',
  places: [], transitions: [], arcs: [],
  nodes: [
    // Center Chopsticks (Equilateral Triangle)
    { id: 'c1', type: 'place', position: { x: 435, y: 350 }, data: { name: 'Chop 1', tokens: 1 } },
    { id: 'c2', type: 'place', position: { x: 340, y: 450 }, data: { name: 'Chop 2', tokens: 1 } },
    { id: 'c3', type: 'place', position: { x: 530, y: 450 }, data: { name: 'Chop 3', tokens: 1 } },
    
    // Philosopher 1 (Top)
    { id: 'p1_t', type: 'place', position: { x: 435, y: 50 }, data: { name: 'P1_Think', tokens: 1 } },
    { id: 't1_take', type: 'transition', position: { x: 375, y: 150 }, data: { name: 'T1_Take' } },
    { id: 'p1_e', type: 'place', position: { x: 435, y: 220 }, data: { name: 'P1_Eat', tokens: 0 } },
    { id: 't1_put', type: 'transition', position: { x: 495, y: 150 }, data: { name: 'T1_Put' } },

    // Philosopher 2 (Bottom Left)
    { id: 'p2_t', type: 'place', position: { x: 100, y: 600 }, data: { name: 'P2_Think', tokens: 1 } },
    { id: 't2_take', type: 'transition', position: { x: 200, y: 500 }, data: { name: 'T2_Take' } },
    { id: 'p2_e', type: 'place', position: { x: 100, y: 450 }, data: { name: 'P2_Eat', tokens: 0 } },
    { id: 't2_put', type: 'transition', position: { x: 100, y: 300 }, data: { name: 'T2_Put' } },

    // Philosopher 3 (Bottom Right)
    { id: 'p3_t', type: 'place', position: { x: 770, y: 600 }, data: { name: 'P3_Think', tokens: 1 } },
    { id: 't3_take', type: 'transition', position: { x: 670, y: 500 }, data: { name: 'T3_Take' } },
    { id: 'p3_e', type: 'place', position: { x: 770, y: 450 }, data: { name: 'P3_Eat', tokens: 0 } },
    { id: 't3_put', type: 'transition', position: { x: 770, y: 300 }, data: { name: 'T3_Put' } },
  ],
  edges: [
    // P1 Cycle
    edge('e1_1', 'p1_t', 't1_take', 'source-left', 'target-left', 0.5),
    edge('e1_2', 't1_take', 'p1_e', 'source-right', 'target-left', 0.5),
    edge('e1_3', 'p1_e', 't1_put', 'source-right', 'target-left', 0.5),
    edge('e1_4', 't1_put', 'p1_t', 'source-right', 'target-right', 1.2),
    edge('c1_t1', 'c1', 't1_take', 'source-left', 'target-right', 0.2),
    edge('c2_t1', 'c2', 't1_take', 'source-left', 'target-right', 0.8),
    edge('t1_c1', 't1_put', 'c1', 'source-left', 'target-right', 0.2),
    edge('t1_c2', 't1_put', 'c2', 'source-left', 'target-right', 0.8),

    // P2 Cycle
    edge('e2_1', 'p2_t', 't2_take', 'source-right', 'target-left', 0.5),
    edge('e2_2', 't2_take', 'p2_e', 'source-left', 'target-right', 0.5),
    edge('e2_3', 'p2_e', 't2_put', 'source-left', 'target-right', 0.5),
    edge('e2_4', 't2_put', 'p2_t', 'source-left', 'target-left', 1.2),
    edge('c2_t2', 'c2', 't2_take', 'source-left', 'target-right', 0.3),
    edge('c3_t2', 'c3', 't2_take', 'source-left', 'target-right', 0.8),
    edge('t2_c2', 't2_put', 'c2', 'source-left', 'target-right', 0.3),
    edge('t2_c3', 't2_put', 'c3', 'source-left', 'target-right', 0.8),

    // P3 Cycle
    edge('e3_1', 'p3_t', 't3_take', 'source-left', 'target-right', 0.5),
    edge('e3_2', 't3_take', 'p3_e', 'source-right', 'target-left', 0.5),
    edge('e3_3', 'p3_e', 't3_put', 'source-right', 'target-left', 0.5),
    edge('e3_4', 't3_put', 'p3_t', 'source-right', 'target-right', 1.2),
    edge('c3_t3', 'c3', 't3_take', 'source-right', 'target-left', 0.3),
    edge('c1_t3', 'c1', 't3_take', 'source-right', 'target-left', 0.8),
    edge('t3_c3', 't3_put', 'c3', 'source-right', 'target-left', 0.3),
    edge('t3_p1_c1', 't3_put', 'c1', 'source-right', 'target-left', 0.8),
  ],
};

// 3. Mutual Exclusion (Symmetrical Balance)
export const mutualExclusion: PetriNetExample = {
  id: 'mut-ex',
  name: 'Mutual Exclusion',
  description: 'Two isolated processes synchronized via a central Mutex.',
  places: [], transitions: [], arcs: [],
  nodes: [
    { id: 'p1', type: 'place', position: { x: 150, y: 100 }, data: { name: 'P1_Idle', tokens: 1 } },
    { id: 't1', type: 'transition', position: { x: 150, y: 250 }, data: { name: 'P1_Enter' } },
    { id: 'p2', type: 'place', position: { x: 150, y: 400 }, data: { name: 'P1_CS', tokens: 0 } },
    { id: 't2', type: 'transition', position: { x: 150, y: 550 }, data: { name: 'P1_Exit' } },
    { id: 'mutex', type: 'place', position: { x: 400, y: 325 }, data: { name: 'Mutex', tokens: 1 } },
    { id: 'p4', type: 'place', position: { x: 650, y: 100 }, data: { name: 'P2_Idle', tokens: 1 } },
    { id: 't3', type: 'transition', position: { x: 650, y: 250 }, data: { name: 'P2_Enter' } },
    { id: 'p5', type: 'place', position: { x: 650, y: 400 }, data: { name: 'P2_CS', tokens: 0 } },
    { id: 't4', type: 'transition', position: { x: 650, y: 550 }, data: { name: 'P2_Exit' } },
  ],
  edges: [
    edge('a1', 'p1', 't1', 'source-right', 'target-right', 0),
    edge('a2', 't1', 'p2', 'source-left', 'target-left', 0),
    edge('a3', 'p2', 't2', 'source-right', 'target-right', 0),
    edge('a4', 't2', 'p1', 'source-left', 'target-left', 1.8),
    edge('m1', 'mutex', 't1', 'source-left', 'target-right', 0.3),
    edge('m2', 't2', 'mutex', 'source-right', 'target-left', 0.3),
    edge('m3', 'mutex', 't3', 'source-right', 'target-left', 0.3),
    edge('m4', 't4', 'mutex', 'source-left', 'target-right', 0.3),
    edge('a5', 'p4', 't3', 'source-left', 'target-left', 0),
    edge('a6', 't3', 'p5', 'source-right', 'target-right', 0),
    edge('a7', 'p5', 't4', 'source-left', 'target-left', 0),
    edge('a8', 't4', 'p4', 'source-right', 'target-right', 1.8),
  ],
};

// 4. Traffic Light Controller (Hexagonal Cycle)
export const trafficLight: PetriNetExample = {
  id: 'traffic-light',
  name: 'Traffic Light Controller',
  description: 'A continuous cycle through Red, Green, and Yellow states.',
  places: [], transitions: [], arcs: [],
  nodes: [
    { id: 'r', type: 'place', position: { x: 400, y: 80 }, data: { name: 'Red', tokens: 1 } },
    { id: 't1', type: 'transition', position: { x: 600, y: 200 }, data: { name: 'To_Green' } },
    { id: 'g', type: 'place', position: { x: 600, y: 450 }, data: { name: 'Green', tokens: 0 } },
    { id: 't2', type: 'transition', position: { x: 400, y: 570 }, data: { name: 'To_Yellow' } },
    { id: 'y', type: 'place', position: { x: 200, y: 450 }, data: { name: 'Yellow', tokens: 0 } },
    { id: 't3', type: 'transition', position: { x: 200, y: 200 }, data: { name: 'To_Red' } },
  ],
  edges: [
    edge('a1', 'r', 't1', 'source-right', 'target-left', 0.5),
    edge('a2', 't1', 'g', 'source-right', 'target-left', 0.5),
    edge('a3', 'g', 't2', 'source-left', 'target-right', 0.5),
    edge('a4', 't2', 'y', 'source-left', 'target-right', 0.5),
    edge('a5', 'y', 't3', 'source-right', 'target-left', 0.5),
    edge('a6', 't3', 'r', 'source-right', 'target-left', 0.5),
  ],
};

// 5. Vending Machine (Aligned Chain)
export const vendingMachine: PetriNetExample = {
  id: 'vending-machine',
  name: 'Vending Machine',
  description: 'Requires two coins to dispense a drink.',
  places: [], transitions: [], arcs: [],
  nodes: [
    { id: 'i', type: 'place', position: { x: 100, y: 200 }, data: { name: 'Idle', tokens: 1 } },
    { id: 't1', type: 'transition', position: { x: 250, y: 200 }, data: { name: 'Coin_In' } },
    { id: 'c1', type: 'place', position: { x: 400, y: 200 }, data: { name: '1_Coin', tokens: 0 } },
    { id: 't2', type: 'transition', position: { x: 550, y: 200 }, data: { name: 'Coin_In' } },
    { id: 'c2', type: 'place', position: { x: 700, y: 200 }, data: { name: '2_Coins', tokens: 0 } },
    { id: 't3', type: 'transition', position: { x: 850, y: 200 }, data: { name: 'Dispense' } },
    { id: 'd', type: 'place', position: { x: 850, y: 400 }, data: { name: 'Drink_Ready', tokens: 0 } },
    { id: 't4', type: 'transition', position: { x: 475, y: 400 }, data: { name: 'Collect' } },
  ],
  edges: [
    edge('a1', 'i', 't1', 'source-right', 'target-left'),
    edge('a2', 't1', 'c1', 'source-right', 'target-left'),
    edge('a3', 'c1', 't2', 'source-right', 'target-left'),
    edge('a4', 't2', 'c2', 'source-right', 'target-left'),
    edge('a5', 'c2', 't3', 'source-right', 'target-left'),
    edge('a6', 't3', 'd', 'source-right', 'target-left'),
    edge('a7', 'd', 't4', 'source-left', 'target-right'),
    edge('a8', 't4', 'i', 'source-left', 'target-left', 1.2),
  ],
};

// 6. Client-Server Interaction (Stack-Layer Approach)
export const clientServer: PetriNetExample = {
  id: 'client-server',
  name: 'Client-Server Interaction',
  description: 'Flow through Client, Network, and Server layers.',
  places: [], transitions: [], arcs: [],
  nodes: [
    { id: 'c_i', type: 'place', position: { x: 100, y: 100 }, data: { name: 'Client_Idle', tokens: 1 } },
    { id: 't1', type: 'transition', position: { x: 250, y: 100 }, data: { name: 'Send_Req' } },
    { id: 'c_w', type: 'place', position: { x: 400, y: 100 }, data: { name: 'Wait_Reply', tokens: 0 } },
    { id: 'n_q', type: 'place', position: { x: 250, y: 250 }, data: { name: 'Net_Req_Queue', tokens: 0 } },
    { id: 't2', type: 'transition', position: { x: 100, y: 400 }, data: { name: 'Start_Proc' } },
    { id: 's_i', type: 'place', position: { x: 100, y: 250 }, data: { name: 'Server_Idle', tokens: 1 } },
    { id: 's_p', type: 'place', position: { x: 250, y: 400 }, data: { name: 'Processing', tokens: 0 } },
    { id: 't3', type: 'transition', position: { x: 400, y: 400 }, data: { name: 'Send_Reply' } },
    { id: 'n_r', type: 'place', position: { x: 400, y: 250 }, data: { name: 'Net_Reply_Queue', tokens: 0 } },
    { id: 't4', type: 'transition', position: { x: 550, y: 100 }, data: { name: 'Recv_Ok' } },
  ],
  edges: [
    edge('a1', 'c_i', 't1', 'source-right', 'target-left'),
    edge('a2', 't1', 'c_w', 'source-right', 'target-left'),
    edge('a3', 't1', 'n_q', 'source-right', 'target-left'),
    edge('a4', 'n_q', 't2', 'source-right', 'target-right', 0.5),
    edge('a5', 's_i', 't2', 'source-right', 'target-left'),
    edge('a6', 't2', 's_p', 'source-right', 'target-left'),
    edge('a7', 's_p', 't3', 'source-right', 'target-left'),
    edge('a8', 't3', 's_i', 'source-left', 'target-left', 1.2),
    edge('a9', 't3', 'n_r', 'source-right', 'target-left'),
    edge('a10', 'n_r', 't4', 'source-right', 'target-right', 0.5),
    edge('a11', 'c_w', 't4', 'source-right', 'target-left'),
    edge('a12', 't4', 'c_i', 'source-left', 'target-left', 2.0),
  ],
};

// 7. Document Approval (Hierarchical Layout)
export const documentApproval: PetriNetExample = {
  id: 'doc-approval',
  name: 'Document Approval',
  description: 'A hierarchy of drafting, evaluation, and revision.',
  places: [], transitions: [], arcs: [],
  nodes: [
    { id: 'd_v', type: 'place', position: { x: 100, y: 250 }, data: { name: 'Draft', tokens: 1 } },
    { id: 't1', type: 'transition', position: { x: 250, y: 250 }, data: { name: 'Submit' } },
    { id: 'p_a', type: 'place', position: { x: 450, y: 250 }, data: { name: 'Pending', tokens: 0 } },
    { id: 't2', type: 'transition', position: { x: 650, y: 150 }, data: { name: 'Approve' } },
    { id: 'a_d', type: 'place', position: { x: 850, y: 150 }, data: { name: 'Approved', tokens: 0 } },
    { id: 't3', type: 'transition', position: { x: 650, y: 350 }, data: { name: 'Reject' } },
    { id: 'r_d', type: 'place', position: { x: 850, y: 350 }, data: { name: 'Rejected', tokens: 0 } },
    { id: 't4', type: 'transition', position: { x: 450, y: 500 }, data: { name: 'Revise' } },
  ],
  edges: [
    edge('e1', 'd_v', 't1', 'source-right', 'target-left'),
    edge('e2', 't1', 'p_a', 'source-right', 'target-left'),
    edge('e3', 'p_a', 't2', 'source-right', 'target-left', 0.4),
    edge('e4', 't2', 'a_d', 'source-right', 'target-left'),
    edge('e5', 'p_a', 't3', 'source-right', 'target-left', 0.4),
    edge('e6', 't3', 'r_d', 'source-right', 'target-left'),
    edge('e7', 'r_d', 't4', 'source-left', 'target-right', 0.5),
    edge('e8', 't4', 'd_v', 'source-left', 'target-left', 1.2),
  ],
};

// 8. Order Fulfillment (Linear Chain)
export const orderFulfillment: PetriNetExample = {
  id: 'order-fulfillment',
  name: 'Order Fulfillment',
  description: 'Perfectly aligned sequential business process.',
  places: [], transitions: [], arcs: [],
  nodes: [
    { id: 'p_r', type: 'place', position: { x: 100, y: 200 }, data: { name: 'Received', tokens: 1 } },
    { id: 't1', type: 'transition', position: { x: 250, y: 200 }, data: { name: 'Verify' } },
    { id: 'p_v', type: 'place', position: { x: 400, y: 200 }, data: { name: 'Verified', tokens: 0 } },
    { id: 't2', type: 'transition', position: { x: 550, y: 200 }, data: { name: 'Pack' } },
    { id: 'p_p', type: 'place', position: { x: 700, y: 200 }, data: { name: 'Packed', tokens: 0 } },
    { id: 't3', type: 'transition', position: { x: 850, y: 200 }, data: { name: 'Ship' } },
    { id: 'p_s', type: 'place', position: { x: 1000, y: 200 }, data: { name: 'Shipped', tokens: 0 } },
  ],
  edges: [
    edge('a1', 'p_r', 't1', 'source-right', 'target-left'),
    edge('a2', 't1', 'p_v', 'source-right', 'target-left'),
    edge('a3', 'p_v', 't2', 'source-right', 'target-left'),
    edge('a4', 't2', 'p_p', 'source-right', 'target-left'),
    edge('a5', 'p_p', 't3', 'source-right', 'target-left'),
    edge('a6', 't3', 'p_s', 'source-right', 'target-left'),
  ],
};

// 9. Service Queue (Loop-back Resource)
export const serviceQueue: PetriNetExample = {
  id: 'service-queue',
  name: 'Service Queue (MM1)',
  description: 'Resource-constrained service with recycling agent.',
  places: [], transitions: [], arcs: [],
  nodes: [
    { id: 't1', type: 'transition', position: { x: 100, y: 150 }, data: { name: 'Arrival' } },
    { id: 'q', type: 'place', position: { x: 250, y: 150 }, data: { name: 'Queue', tokens: 0 } },
    { id: 't2', type: 'transition', position: { x: 450, y: 150 }, data: { name: 'Serve' } },
    { id: 'p_proc', type: 'place', position: { x: 650, y: 150 }, data: { name: 'In_Proc', tokens: 0 } },
    { id: 't3', type: 'transition', position: { x: 850, y: 150 }, data: { name: 'Complete' } },
    { id: 's', type: 'place', position: { x: 450, y: 300 }, data: { name: 'Server_Idle', tokens: 1 } },
  ],
  edges: [
    edge('e1', 't1', 'q', 'source-right', 'target-left', 0),
    edge('e2', 'q', 't2', 'source-right', 'target-left', 0),
    edge('e3', 's', 't2', 'source-right', 'target-left', 0.5),
    edge('e4', 't2', 'p_proc', 'source-right', 'target-left', 0),
    edge('e5', 'p_proc', 't3', 'source-right', 'target-left', 0),
    edge('e6', 't3', 's', 'source-left', 'target-right', 1.0),
  ],
};

// 10. Machine Repair (Cyclic Specialist)
export const machineRepair: PetriNetExample = {
  id: 'machine-repair',
  name: 'Machine Repair Shop',
  description: 'Machines cycling between working, broken, and repair states.',
  places: [], transitions: [], arcs: [],
  nodes: [
    { id: 'w', type: 'place', position: { x: 150, y: 150 }, data: { name: 'Working', tokens: 3 } },
    { id: 't1', type: 'transition', position: { x: 350, y: 150 }, data: { name: 'Break' } },
    { id: 'b', type: 'place', position: { x: 550, y: 150 }, data: { name: 'Broken', tokens: 0 } },
    { id: 't2', type: 'transition', position: { x: 750, y: 150 }, data: { name: 'Repair' } },
    { id: 'r', type: 'place', position: { x: 550, y: 300 }, data: { name: 'Rep_Idle', tokens: 1 } },
  ],
  edges: [
    edge('a1', 'w', 't1', 'source-right', 'target-left'),
    edge('a2', 't1', 'b', 'source-right', 'target-left'),
    edge('a3', 'b', 't2', 'source-right', 'target-left'),
    edge('a4', 'r', 't2', 'source-right', 'target-right', 0.5),
    edge('a5', 't2', 'r', 'source-left', 'target-left', 0.8),
    edge('a6', 't2', 'w', 'source-left', 'target-left', 1.8),
  ],
};

export const emptyExample: PetriNetExample = {
  id: 'empty', name: 'Empty Diagram', description: 'Start from scratch',
  places: [], transitions: [], arcs: [], nodes: [], edges: []
};

export const examples: PetriNetExample[] = [
  producerConsumer,
  diningPhilosophers,
  mutualExclusion,
  trafficLight,
  vendingMachine,
  clientServer,
  documentApproval,
  orderFulfillment,
  serviceQueue,
  machineRepair,
  emptyExample,
];
