import { PetriNetExample } from '../lib/types';

import producerConsumerJson from './models/petri-net-producer-consumer.json';
import mutualExclusionJson from './models/petri-net-mut-ex.json';
import vendingMachineJson from './models/petri-net-vending-machine.json';
import clientServerJson from './models/petri-net-client-server.json';
import documentApprovalJson from './models/petri-net-doc-approval.json';
import orderFulfillmentJson from './models/petri-net-order-fulfillment.json';
import studentEnrollmentJson from './models/petri-net-student-enrollment.json';
import serviceQueueJson from './models/petri-net-service-queue.json';
import compensationRequestJson from './models/petri-net-compensation-request.json';
import machineRepairJson from './models/petri-net-machine-repair.json';
import kanbanBoardJson from './models/petri-net-kanban-board.json';

type ExampleJson = {
  nodes: PetriNetExample['nodes'];
  edges: PetriNetExample['edges'];
  metadata?: {
    name?: string;
  };
};

function fromJson(
  json: ExampleJson,
  id: string,
  name: string,
  description: string
): PetriNetExample {
  return {
    id,
    name,
    description,
    places: [],
    transitions: [],
    arcs: [],
    nodes: json.nodes ?? [],
    edges: json.edges ?? [],
  };
}

export const producerConsumer = fromJson(
  producerConsumerJson as ExampleJson,
  'producer-consumer',
  'Producer-Consumer',
  'Imported from JSON model.'
);

export const mutualExclusion = fromJson(
  mutualExclusionJson as ExampleJson,
  'mut-ex',
  'Mutual Exclusion',
  'Imported from JSON model.'
);

export const vendingMachine = fromJson(
  vendingMachineJson as ExampleJson,
  'vending-machine',
  'Vending Machine',
  'Imported from JSON model.'
);

export const clientServer = fromJson(
  clientServerJson as ExampleJson,
  'client-server',
  'Client-Server Interaction',
  'Imported from JSON model.'
);

export const documentApproval = fromJson(
  documentApprovalJson as ExampleJson,
  'doc-approval',
  'Document Approval',
  'Imported from JSON model.'
);

export const orderFulfillment = fromJson(
  orderFulfillmentJson as ExampleJson,
  'order-fulfillment',
  'Order Fulfillment',
  'Imported from JSON model.'
);

export const studentEnrollment = fromJson(
  studentEnrollmentJson as ExampleJson,
  'student-enrollment',
  'Student Enrollment',
  'Imported from JSON model.'
);

export const serviceQueue = fromJson(
  serviceQueueJson as ExampleJson,
  'service-queue',
  'Service Queue (MM1)',
  'Imported from JSON model.'
);

export const compensationRequest = fromJson(
  compensationRequestJson as ExampleJson,
  'compensation-request',
  'Compensation Request',
  'Imported from JSON model.'
);

export const machineRepair = fromJson(
  machineRepairJson as ExampleJson,
  'machine-repair',
  'Machine Repair Shop',
  'Imported from JSON model.'
);

export const kanbanBoard = fromJson(
  kanbanBoardJson as ExampleJson,
  'kanban-board',
  'Kanban Board',
  'Imported from JSON model.'
);

export const emptyExample: PetriNetExample = {
  id: 'empty',
  name: 'Empty Diagram',
  description: 'Start from scratch',
  places: [],
  transitions: [],
  arcs: [],
  nodes: [],
  edges: [],
};

export const examples: PetriNetExample[] = [
  emptyExample,
  producerConsumer,
  mutualExclusion,
  vendingMachine,
  clientServer,
  documentApproval,
  orderFulfillment,
  studentEnrollment,
  serviceQueue,
  compensationRequest,
  machineRepair,
  kanbanBoard,
];