import { PetriNetExample } from '../lib/types';
import { 
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
  emptyExample 
} from './library';

export const examples: PetriNetExample[] = [
  emptyExample,
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
];
