export const IS_MAC =
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

export const MOD_KEY = IS_MAC ? '⌘' : 'Ctrl';

export const SHORTCUT_GROUPS: { title: string; items: { keys: string; description: string }[] }[] = [
  {
    title: 'Editing',
    items: [
      { keys: 'P', description: 'Add a place in view' },
      { keys: 'T', description: 'Add a transition in view' },
      { keys: 'Delete', description: 'Delete the selection (Backspace also works)' },
      { keys: `${MOD_KEY}+Z`, description: 'Undo the last edit' },
      { keys: `${MOD_KEY}+Shift+Z`, description: 'Redo' },
      { keys: 'Shift+Click', description: 'Add to the selection' },
    ],
  },
  {
    title: 'Connecting',
    items: [
      { keys: 'Drag', description: 'From a dot on a node’s edge onto another node' },
      { keys: 'Drop', description: 'On empty canvas to create the next element' },
      { keys: 'Double-click', description: 'An arc to change its weight' },
    ],
  },
  {
    title: 'Simulation',
    items: [
      { keys: 'Space', description: 'Fire one enabled transition' },
      { keys: 'Shift+Space', description: 'Run or pause the simulation' },
      { keys: 'B', description: 'Step back' },
      { keys: 'R', description: 'Reset to the initial marking' },
      { keys: 'Double-click', description: 'An enabled transition to fire it' },
    ],
  },
  {
    title: 'View',
    items: [
      { keys: 'I', description: 'Show or hide the inspector' },
      { keys: '?', description: 'Show these shortcuts' },
    ],
  },
];

/** Keys typed into a field, or activating a focused control, are not shortcuts. */
export function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  );
}

export function isActivationTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  return target.closest('button, a[href], [role="tab"], [role="menuitemradio"]') !== null;
}
