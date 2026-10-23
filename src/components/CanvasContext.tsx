import { createContext, useContext } from 'react';

export interface UndoOptions {
  /** Consecutive edits with the same key within a short window collapse into one undo step. */
  key?: string;
  /** Places whose token counts this edit changes; undo restores only these markings. */
  markingIds?: string[];
}

export interface FiringFlash {
  key: number;
  transitionId: string;
  placeIds: Set<string>;
}

export interface CanvasContextValue {
  isPlaying: boolean;
  enabledIds: Set<string>;
  /** Arcs currently carrying an animated token. */
  firingEdgeIds: Set<string>;
  firingKey: number;
  /** Duration of one animation phase (token travelling along an arc). */
  firingMs: number;
  /** The transition currently firing (mid-animation). */
  firingTransitionId: string | null;
  /** The transition that fired last and the places it changed, briefly highlighted. */
  flash: FiringFlash | null;
  /** Arcs with a reverse partner sharing both endpoints; drawn with a parallel offset. */
  overlappingEdgeIds: Set<string>;
  hoveredEdgeId: string | null;
  editingEdgeId: string | null;
  setEditingEdgeId: (id: string | null) => void;
  commitWeight: (edgeId: string, weight: number) => void;
  recordUndo: (label: string, options?: UndoOptions) => void;
}

const noop = () => {};

export const CanvasContext = createContext<CanvasContextValue>({
  isPlaying: false,
  enabledIds: new Set(),
  firingEdgeIds: new Set(),
  firingKey: 0,
  firingMs: 300,
  firingTransitionId: null,
  flash: null,
  overlappingEdgeIds: new Set(),
  hoveredEdgeId: null,
  editingEdgeId: null,
  setEditingEdgeId: noop,
  commitWeight: noop,
  recordUndo: noop,
});

export const useCanvas = () => useContext(CanvasContext);
