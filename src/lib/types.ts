export interface NetPlace {
  id: string;
  name: string;
  tokens: number;
}

export interface NetTransition {
  id: string;
  name: string;
}

export interface NetArc {
  id: string;
  source: string;
  target: string;
  weight: number;
  curvature?: number;
}

export interface PetriNetState {
  places: NetPlace[];
  transitions: NetTransition[];
  arcs: NetArc[];
}

export interface SimulationLogEntry {
  transitionId: string;
  transitionName: string;
  timestamp: number;
}

export interface PetriNetExample {
  id: string;
  name: string;
  description: string;
  places: NetPlace[];
  transitions: NetTransition[];
  arcs: NetArc[];
  nodes: any[];
  edges: any[];
}
export interface NetProperties {
  isSafe: boolean;
  isBounded: boolean;
  isConservative: boolean;
  isLive: boolean;
  hasDeadlock: boolean;
  isReversible: boolean;
}
