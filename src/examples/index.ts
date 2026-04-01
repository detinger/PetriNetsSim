import { PetriNetExample } from '../lib/types';
import {
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
  emptyExample,
} from './library';

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