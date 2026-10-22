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

/** One firing in the simulation log. */
export interface LogEntry {
  step: number;
  transitionId: string;
  transitionName: string;
  time: number;
  /** Tokens per place after the firing. */
  marking: Record<string, number>;
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
