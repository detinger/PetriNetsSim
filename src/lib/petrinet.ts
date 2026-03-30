import { NetArc, NetPlace, NetTransition } from './types';

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
  return places.map((p) =>
    transitions.map((t) => {
      const arc = arcs.find((a) => a.source === p.id && a.target === t.id);
      return arc ? arc.weight : 0;
    })
  );
}

// Post-incidence matrix W+ (places x transitions)
// W+[p, t] = weight of arc from t to p
export function getPostIncidenceMatrix(
  places: NetPlace[],
  transitions: NetTransition[],
  arcs: NetArc[]
): number[][] {
  return places.map((p) =>
    transitions.map((t) => {
      const arc = arcs.find((a) => a.source === t.id && a.target === p.id);
      return arc ? arc.weight : 0;
    })
  );
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
  return transitions.filter((t) => {
    // find all input places for this transition
    const inputArcs = arcs.filter((a) => a.target === t.id);
    for (const arc of inputArcs) {
      const sourcePlace = places.find((p) => p.id === arc.source);
      if (!sourcePlace || sourcePlace.tokens < arc.weight) {
        return false;
      }
    }
    return true;
  });
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

  const inArcs = arcs.filter((a) => a.source === transitionId || a.target === transitionId);

  return places.map((place) => {
    let newTokens = place.tokens;

    // input arc (deduct tokens)
    const inArc = inArcs.find((a) => a.source === place.id && a.target === transitionId);
    if (inArc) {
      newTokens -= inArc.weight;
    }

    // output arc (add tokens)
    const outArc = inArcs.find((a) => a.source === transitionId && a.target === place.id);
    if (outArc) {
      newTokens += outArc.weight;
    }

    return { ...place, tokens: newTokens };
  });
}

// Net analysis structure
export interface NetProperties {
  isSafe: boolean;
  isBounded: boolean;
  isConservative: boolean;
  isLive: boolean;
  hasDeadlock: boolean;
  isReversible: boolean;
}

export function analyzeNet(
  places: NetPlace[],
  initialPlaces: NetPlace[],
  transitions: NetTransition[],
  arcs: NetArc[]
): NetProperties {
  const enabled = getEnabledTransitions(places, transitions, arcs);
  
  const currentTokens = places.reduce((sum, p) => sum + p.tokens, 0);
  const initialTokens = initialPlaces.reduce((sum, p) => sum + p.tokens, 0);

  return {
    isSafe: places.every((p) => p.tokens <= 1),
    isBounded: currentTokens <= initialTokens, // Heuristic: Bounded if total tokens don't grow
    isConservative: currentTokens === initialTokens,
    isLive: transitions.length > 0 && enabled.length === transitions.length,
    hasDeadlock: transitions.length > 0 && enabled.length === 0,
    isReversible: JSON.stringify(places.map(p => p.tokens)) === JSON.stringify(initialPlaces.map(p => p.tokens))
  };
}
