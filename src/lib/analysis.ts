import { NetArc, NetPlace, NetTransition } from './types';

/** Stop exploring after this many markings; larger state spaces are reported as undecided. */
export const STATE_LIMIT = 2000;
/** ω: a place that can hold arbitrarily many tokens. */
export const OMEGA = Infinity;

export interface ReachState {
  id: number;
  marking: number[];
  parent: number | null;
  /** Transition fired from the parent to reach this state. */
  via: string | null;
  depth: number;
}

export interface ReachEdge {
  from: number;
  to: number;
  transitions: string[];
}

/** Why a property holds or fails; ids are formatted with current names at render time. */
export type Detail =
  | { kind: 'bound'; bound: number }
  | { kind: 'unbounded'; places: string[] }
  | { kind: 'overfull'; place: string; tokens: number; path: string[] }
  | { kind: 'tokenChange'; from: number; to: number; path: string[] }
  | { kind: 'deadlock'; path: string[] }
  | { kind: 'deadTransition'; transition: string }
  | { kind: 'starved'; transition: string; path: string[] }
  | { kind: 'noReturn'; path: string[] }
  | { kind: 'unknownUnbounded' }
  | { kind: 'unknownLarge'; limit: number };

export interface Verdict {
  /** null when the property can't be decided from the explored graph. */
  value: boolean | null;
  detail?: Detail;
}

export interface NetAnalysis {
  placeIds: string[];
  states: ReachState[];
  edges: ReachEdge[];
  /** True when exploration stopped at STATE_LIMIT. */
  truncated: boolean;
  /** True when the graph is a coverability graph (some place reached ω). */
  hasOmega: boolean;
  /** Reachable markings (without ω) in which no transition is enabled. */
  deadIds: number[];
  bounded: Verdict;
  safe: Verdict;
  conservative: Verdict;
  deadlockFree: Verdict;
  live: Verdict;
  reversible: Verdict;
}

export function markingKey(marking: number[]) {
  return marking.map((v) => (v === OMEGA ? 'ω' : v)).join(',');
}

/**
 * Explores the markings reachable from `initial`. Bounded nets yield the exact
 * reachability graph; unbounded nets yield a Karp–Miller coverability graph
 * where ω marks places that can grow without limit.
 */
export function analyzeNet(
  places: NetPlace[],
  transitions: NetTransition[],
  arcs: NetArc[],
  initial: number[]
): NetAnalysis {
  const P = places.length;
  const placeIndex = new Map(places.map((p, i) => [p.id, i]));
  const transitionIndex = new Map(transitions.map((t, i) => [t.id, i]));
  const pre = transitions.map(() => new Array<number>(P).fill(0));
  const post = transitions.map(() => new Array<number>(P).fill(0));

  for (const arc of arcs) {
    const p = placeIndex.get(arc.source);
    const t = transitionIndex.get(arc.target);
    if (p !== undefined && t !== undefined) {
      pre[t][p] += arc.weight;
      continue;
    }
    const t2 = transitionIndex.get(arc.source);
    const p2 = placeIndex.get(arc.target);
    if (t2 !== undefined && p2 !== undefined) post[t2][p2] += arc.weight;
  }

  const isEnabled = (marking: number[], t: number) => marking.every((v, p) => v >= pre[t][p]);

  const states: ReachState[] = [{ id: 0, marking: initial.slice(), parent: null, via: null, depth: 0 }];
  const index = new Map<string, number>([[markingKey(initial), 0]]);
  const successors: { to: number; t: number }[][] = [[]];
  let truncated = false;

  for (let head = 0; head < states.length; head++) {
    const state = states[head];
    for (let t = 0; t < transitions.length; t++) {
      if (!isEnabled(state.marking, t)) continue;
      const next = state.marking.map((v, p) => (v === OMEGA ? OMEGA : v - pre[t][p] + post[t][p]));

      // Karp–Miller acceleration: strictly covering an ancestor means the growth can repeat forever
      for (let a: number | null = head; a !== null; a = states[a].parent) {
        const ancestor = states[a].marking;
        let covers = true;
        let strictly = false;
        for (let p = 0; p < P; p++) {
          if (ancestor[p] > next[p]) {
            covers = false;
            break;
          }
          if (ancestor[p] < next[p]) strictly = true;
        }
        if (covers && strictly) {
          for (let p = 0; p < P; p++) if (ancestor[p] < next[p]) next[p] = OMEGA;
        }
      }

      const key = markingKey(next);
      let id = index.get(key);
      if (id === undefined) {
        if (states.length >= STATE_LIMIT) {
          truncated = true;
          continue;
        }
        id = states.length;
        states.push({ id, marking: next, parent: head, via: transitions[t].id, depth: state.depth + 1 });
        index.set(key, id);
        successors.push([]);
      }
      successors[head].push({ to: id, t });
    }
  }

  const pathTo = (id: number) => {
    const path: string[] = [];
    for (let s: number | null = id; s !== null && states[s].via; s = states[s].parent) path.push(states[s].via!);
    return path.reverse();
  };

  // States without ω are genuinely reachable markings (ω never disappears once introduced)
  const genuine = states.filter((s) => !s.marking.includes(OMEGA));
  const omegaPlaces = places.filter((_, p) => states.some((s) => s.marking[p] === OMEGA)).map((p) => p.id);
  const hasOmega = omegaPlaces.length > 0;
  const unknown: Verdict = hasOmega
    ? { value: null, detail: { kind: 'unknownUnbounded' } }
    : { value: null, detail: { kind: 'unknownLarge', limit: STATE_LIMIT } };
  const complete = !hasOmega && !truncated;

  // Boundedness
  let bounded: Verdict;
  if (hasOmega) bounded = { value: false, detail: { kind: 'unbounded', places: omegaPlaces } };
  else if (truncated) bounded = unknown;
  else {
    const bound = Math.max(0, ...states.flatMap((s) => s.marking));
    bounded = { value: true, detail: { kind: 'bound', bound } };
  }

  // Safeness: no place ever holds more than one token
  let safe: Verdict;
  const overfull = genuine.find((s) => s.marking.some((v) => v > 1));
  if (overfull) {
    const p = overfull.marking.findIndex((v) => v > 1);
    safe = { value: false, detail: { kind: 'overfull', place: places[p].id, tokens: overfull.marking[p], path: pathTo(overfull.id) } };
  } else if (hasOmega) safe = { value: false, detail: { kind: 'unbounded', places: omegaPlaces } };
  else if (truncated) safe = unknown;
  else safe = { value: true };

  // Conservation: the total number of tokens never changes
  let conservative: Verdict;
  const sum = (m: number[]) => m.reduce((a, b) => a + b, 0);
  const initialSum = sum(initial);
  const changed = genuine.find((s) => sum(s.marking) !== initialSum);
  if (changed) {
    conservative = { value: false, detail: { kind: 'tokenChange', from: initialSum, to: sum(changed.marking), path: pathTo(changed.id) } };
  } else if (hasOmega) conservative = { value: false, detail: { kind: 'unbounded', places: omegaPlaces } };
  else if (truncated) conservative = unknown;
  else conservative = { value: true };

  // Deadlock freedom: every reachable marking enables something
  const deadStates = genuine.filter((s) => !transitions.some((_, t) => isEnabled(s.marking, t)));
  const dead = deadStates[0];
  const deadlockFree: Verdict = dead
    ? { value: false, detail: { kind: 'deadlock', path: pathTo(dead.id) } }
    : complete
      ? { value: true }
      : unknown;

  // Liveness: from every reachable marking, every transition can fire again eventually
  let live: Verdict;
  const everEnabled = new Set<number>();
  if (!truncated) {
    for (const s of states) transitions.forEach((_, t) => isEnabled(s.marking, t) && everEnabled.add(t));
  }
  const neverFires = truncated ? -1 : transitions.findIndex((_, t) => !everEnabled.has(t));
  if (dead && transitions.length > 0) {
    live = { value: false, detail: { kind: 'deadlock', path: pathTo(dead.id) } };
  } else if (neverFires >= 0) {
    // The coverability graph over-approximates enabling, so this holds for unbounded nets too
    live = { value: false, detail: { kind: 'deadTransition', transition: transitions[neverFires].id } };
  } else if (!complete) {
    live = unknown;
  } else {
    live = { value: true };
    for (const component of bottomComponents(states.length, successors)) {
      const members = new Set(component);
      const fired = new Set<number>();
      for (const s of component) for (const { to, t } of successors[s]) if (members.has(to)) fired.add(t);
      const missing = transitions.findIndex((_, t) => !fired.has(t));
      if (missing >= 0) {
        const entry = component.reduce((best, s) => (states[s].depth < states[best].depth ? s : best), component[0]);
        live = { value: false, detail: { kind: 'starved', transition: transitions[missing].id, path: pathTo(entry) } };
        break;
      }
    }
  }

  // Reversibility: the initial marking can be reached again from everywhere
  let reversible: Verdict;
  if (!complete) reversible = unknown;
  else {
    const predecessors: number[][] = states.map(() => []);
    successors.forEach((list, from) => list.forEach(({ to }) => predecessors[to].push(from)));
    const canReturn = new Set<number>([0]);
    const queue = [0];
    while (queue.length) {
      for (const p of predecessors[queue.shift()!]) {
        if (!canReturn.has(p)) {
          canReturn.add(p);
          queue.push(p);
        }
      }
    }
    const stuck = states.find((s) => !canReturn.has(s.id));
    reversible = stuck ? { value: false, detail: { kind: 'noReturn', path: pathTo(stuck.id) } } : { value: true };
  }

  // Merge parallel edges for display
  const edgeMap = new Map<string, ReachEdge>();
  successors.forEach((list, from) => {
    for (const { to, t } of list) {
      const key = `${from}->${to}`;
      const edge = edgeMap.get(key) ?? { from, to, transitions: [] };
      edge.transitions.push(transitions[t].id);
      edgeMap.set(key, edge);
    }
  });

  return {
    placeIds: places.map((p) => p.id),
    states,
    edges: [...edgeMap.values()],
    truncated,
    hasOmega,
    deadIds: deadStates.map((s) => s.id),
    bounded,
    safe,
    conservative,
    deadlockFree,
    live,
    reversible,
  };
}

/** Strongly connected components with no edges leaving them (Tarjan). */
function bottomComponents(count: number, successors: { to: number }[][]): number[][] {
  const index = new Array<number>(count).fill(-1);
  const low = new Array<number>(count).fill(0);
  const onStack = new Array<boolean>(count).fill(false);
  const component = new Array<number>(count).fill(-1);
  const stack: number[] = [];
  const components: number[][] = [];
  let counter = 0;

  // Iterative DFS so deep state spaces can't overflow the call stack
  for (let root = 0; root < count; root++) {
    if (index[root] !== -1) continue;
    const work: { node: number; edge: number }[] = [{ node: root, edge: 0 }];
    index[root] = low[root] = counter++;
    stack.push(root);
    onStack[root] = true;

    while (work.length) {
      const frame = work[work.length - 1];
      const edges = successors[frame.node];
      if (frame.edge < edges.length) {
        const next = edges[frame.edge++].to;
        if (index[next] === -1) {
          index[next] = low[next] = counter++;
          stack.push(next);
          onStack[next] = true;
          work.push({ node: next, edge: 0 });
        } else if (onStack[next]) {
          low[frame.node] = Math.min(low[frame.node], index[next]);
        }
        continue;
      }
      work.pop();
      if (work.length) low[work[work.length - 1].node] = Math.min(low[work[work.length - 1].node], low[frame.node]);
      if (low[frame.node] === index[frame.node]) {
        const members: number[] = [];
        let member: number;
        do {
          member = stack.pop()!;
          onStack[member] = false;
          component[member] = components.length;
          members.push(member);
        } while (member !== frame.node);
        components.push(members);
      }
    }
  }

  return components.filter((members, c) =>
    members.every((s) => successors[s].every(({ to }) => component[to] === c))
  );
}
