import {
  createContext,
  KeyboardEvent as ReactKeyboardEvent,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';
import { clsx } from 'clsx';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

/* ── Keyboard key ─────────────────────────────────────────────────────────── */

export function Kbd({ keys }: { keys: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {keys.split('+').map((key) => (
        <kbd key={key} className="kbd">
          {key}
        </kbd>
      ))}
    </span>
  );
}

/* ── Tooltip ──────────────────────────────────────────────────────────────── */

/**
 * Hover/keyboard-focus tooltip with an optional shortcut. The wrapped control keeps
 * its own accessible name, so the tooltip is hidden from assistive technology.
 */
export function Tooltip({
  label,
  shortcut,
  align = 'center',
  children,
}: {
  label: string;
  shortcut?: string;
  align?: 'start' | 'center' | 'end';
  children: ReactNode;
}) {
  return (
    <span className="tooltip-anchor">
      {children}
      <span className={clsx('tooltip', `tooltip-${align}`)} aria-hidden="true">
        {label}
        {shortcut && <Kbd keys={shortcut} />}
      </span>
    </span>
  );
}

/* ── Toasts ───────────────────────────────────────────────────────────────── */

type ToastTone = 'info' | 'success' | 'warning' | 'error';

export interface ToastOptions {
  tone?: ToastTone;
  title?: string;
  message: string;
  action?: { label: string; onClick: () => void };
  duration?: number;
}

interface ToastItem extends ToastOptions {
  id: number;
}

const ToastContext = createContext<(toast: ToastOptions) => void>(() => {});

export const useToast = () => useContext(ToastContext);

const toastIcons = { info: Info, success: CheckCircle2, warning: AlertTriangle, error: XCircle };

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts((items) => items.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (toast: ToastOptions) => {
      const id = ++nextId.current;
      setToasts((items) => [...items.slice(-3), { ...toast, id }]);
      window.setTimeout(() => dismiss(id), toast.duration ?? (toast.action ? 7000 : 4500));
    },
    [dismiss]
  );

  return (
    <ToastContext.Provider value={push}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toasts.map(({ id, tone = 'info', title, message, action }) => {
          const Icon = toastIcons[tone];
          return (
            <div key={id} className={clsx('toast', `toast-${tone}`)}>
              <Icon className="toast-icon" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                {title && <div className="font-[650]">{title}</div>}
                <div className="text-[13px] text-fg-muted">{message}</div>
              </div>
              {action && (
                <button
                  type="button"
                  className="btn btn-sm btn-ghost text-primary"
                  onClick={() => {
                    action.onClick();
                    dismiss(id);
                  }}
                >
                  {action.label}
                </button>
              )}
              <button type="button" className="btn btn-sm btn-icon btn-ghost" aria-label="Dismiss" onClick={() => dismiss(id)}>
                <X />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

/* ── Dialog ───────────────────────────────────────────────────────────────── */

const focusableSelector =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal dialog: focuses itself on open, traps Tab inside, closes on Escape or
 * backdrop click and returns focus to whatever was focused before.
 */
export function Dialog({
  open,
  title,
  onClose,
  children,
  footer,
  size = 'md',
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md';
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const first = ref.current?.querySelector<HTMLElement>('[data-autofocus]') ?? ref.current;
    first?.focus();
    return () => previous?.focus?.();
  }, [open]);

  if (!open) return null;

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key !== 'Tab' || !ref.current) return;
    const focusables = [...ref.current.querySelectorAll<HTMLElement>(focusableSelector)];
    if (focusables.length === 0) {
      e.preventDefault();
      return;
    }
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  return (
    <div className="dialog-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={clsx('dialog', size === 'sm' && 'dialog-sm')}
        onKeyDown={onKeyDown}
      >
        <div className="dialog-header">
          <h2 id={titleId} className="dialog-title">{title}</h2>
          <button type="button" className="btn btn-sm btn-icon btn-ghost" aria-label="Close" onClick={onClose}>
            <X />
          </button>
        </div>
        <div className="dialog-body">{children}</div>
        {footer && <div className="dialog-footer">{footer}</div>}
      </div>
    </div>
  );
}

/* ── Menu ─────────────────────────────────────────────────────────────────── */

export interface MenuOption<T extends string> {
  value: T;
  label: string;
  icon: typeof Info;
}

/** Single-choice menu (menuitemradio) opened from a trigger button. */
export function ChoiceMenu<T extends string>({
  label,
  value,
  options,
  onChange,
  trigger,
}: {
  label: string;
  value: T;
  options: MenuOption<T>[];
  onChange: (value: T) => void;
  trigger: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    const checked = rootRef.current?.querySelector<HTMLElement>('[aria-checked="true"]');
    checked?.focus();
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  const onMenuKeyDown = (e: ReactKeyboardEvent) => {
    const items = [...(rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitemradio"]') ?? [])];
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const step = e.key === 'ArrowDown' ? 1 : -1;
      items[(index + step + items.length) % items.length]?.focus();
    } else if (e.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="menu">
      <button
        ref={triggerRef}
        type="button"
        className="btn btn-icon btn-ghost"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        {trigger}
      </button>
      {open && (
        <div id={menuId} role="menu" aria-label={label} className="menu-list menu-list-end" onKeyDown={onMenuKeyDown}>
          {options.map(({ value: optionValue, label: optionLabel, icon: Icon }) => (
            <button
              key={optionValue}
              type="button"
              role="menuitemradio"
              aria-checked={optionValue === value}
              tabIndex={-1}
              onClick={() => {
                onChange(optionValue);
                close();
              }}
            >
              <Icon aria-hidden="true" />
              <span className="flex-1">{optionLabel}</span>
              {optionValue === value && <CheckCircle2 className="text-primary" aria-hidden="true" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
