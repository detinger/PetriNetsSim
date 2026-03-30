import { PetriNetExample } from '../lib/types';
import {
  producerConsumer,
  mutualExclusion,
  vendingMachine,
  clientServer,
  documentApproval,
  orderFulfillment,
  serviceQueue,
  machineRepair,
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
  serviceQueue,
  machineRepair,
];