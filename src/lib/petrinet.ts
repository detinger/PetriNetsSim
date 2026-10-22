import { NetArc, NetPlace, NetTransition } from './types';

// Total weight of all arcs from one element to another (duplicate arcs add up)
function arcWeight(arcs: NetArc[], from: string, to: string): number {
  let weight = 0;
  for (const a of arcs) {
    if (a.source === from && a.target === to) weight += a.weight;
  }
  return weight;
}

// Returns the marking vector (number of tokens in each place, ordered by place index)
export function getMarkingVector(places: NetPlace[]): number[] {
  return places.map((p) => p.tokens);
}

// Pre-incidence matrix W- (places x transitions)
// Rows: Places, Cols: Transitions
// W-[p, t] = weight of arc from p to t
export function getPreIncidenceMatrix(
  places: NetPlace[],
  transitions: NetTransition[],
  arcs: NetArc[]
): number[][] {
  return places.map((p) => transitions.map((t) => arcWeight(arcs, p.id, t.id)));
}

// Post-incidence matrix W+ (places x transitions)
// W+[p, t] = weight of arc from t to p
export function getPostIncidenceMatrix(
  places: NetPlace[],
  transitions: NetTransition[],
  arcs: NetArc[]
): number[][] {
  return places.map((p) => transitions.map((t) => arcWeight(arcs, t.id, p.id)));
}

// Incidence matrix W = W+ - W-
export function getIncidenceMatrix(
  pre: number[][],
  post: number[][]
): number[][] {
  return pre.map((row, i) =>
    row.map((_, j) => post[i][j] - pre[i][j])
  );
}

// A transition is enabled if for every input place, tokens >= arc_weight
export function getEnabledTransitions(
  places: NetPlace[],
  transitions: NetTransition[],
  arcs: NetArc[]
): NetTransition[] {
  return transitions.filter((t) =>
    places.every((p) => p.tokens >= arcWeight(arcs, p.id, t.id))
  );
}

// Fire a transition, returning a new array of places with updated tokens
export function fireTransition(
  places: NetPlace[],
  transitions: NetTransition[],
  arcs: NetArc[],
  transitionId: string,
  enabledTransitions?: NetTransition[]
): NetPlace[] {
  const enabled = enabledTransitions || getEnabledTransitions(places, transitions, arcs);
  if (!enabled.find((t) => t.id === transitionId)) {
    throw new Error(`Transition ${transitionId} is not enabled`);
  }

  return places.map((place) => ({
    ...place,
    tokens: place.tokens - arcWeight(arcs, place.id, transitionId) + arcWeight(arcs, transitionId, place.id),
  }));
}
