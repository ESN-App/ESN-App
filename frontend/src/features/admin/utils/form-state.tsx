import { useCallback, useState, type ReactNode } from 'react';
import { HttpError } from '../../../core/http';
import { useEscapeKey } from '../../../shared/hooks';

function addTo(field: string) {
  return (current: ReadonlySet<string>) => (current.has(field) ? current : new Set(current).add(field));
}

/**
 * Tracks Angular's per-field dirty (edited) and touched (blurred) flags, so validation
 * messages appear only after a field was edited, blurred, or a submit was attempted, and
 * the `ng-invalid ng-touched` classes the stylesheets use are applied the same way.
 */
export function useTouchedFields() {
  const [dirty, setDirty] = useState<ReadonlySet<string>>(new Set());
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set());
  const [allTouched, setAllTouched] = useState(false);

  const markDirty = useCallback((field: string) => setDirty(addTo(field)), []);
  const markTouched = useCallback((field: string) => setTouched(addTo(field)), []);
  const touchAll = useCallback(() => setAllTouched(true), []);
  const reset = useCallback(() => {
    setDirty(new Set());
    setTouched(new Set());
    setAllTouched(false);
  }, []);

  const isTouched = (field: string) => allTouched || touched.has(field);
  const isDirty = (field: string) => dirty.has(field);
  /** Angular's `control.invalid && (control.dirty || control.touched)`. */
  const showError = (field: string, invalid: boolean) => invalid && (isDirty(field) || isTouched(field));
  const invalidClass = (field: string, invalid: boolean, base?: string) =>
    [base, invalid && isTouched(field) ? 'ng-invalid ng-touched' : null].filter(Boolean).join(' ') || undefined;
  return { isTouched, isDirty, showError, invalidClass, markDirty, markTouched, touchAll, reset };
}

/**
 * Reads the message from an API error body, like the Angular
 * `response?.error?.error ?? fallback` (or `detail ?? error ?? fallback` with `includeDetail`).
 */
export function apiErrorMessage(err: unknown, fallback: string, includeDetail = false): string {
  const body = err instanceof HttpError ? (err.error as { error?: unknown; detail?: unknown } | null) : null;
  if (includeDetail && body?.detail != null) {
    return String(body.detail);
  }
  return body?.error != null ? String(body.error) : fallback;
}

interface ConfirmationDialogProps {
  title: string;
  message?: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  titleId?: string;
  danger?: boolean;
  /** Escape closes the dialog unless this is true (e.g. while saving). */
  busy?: boolean;
}

/** The `.confirmation-backdrop` alert dialog shared by the admin editors (styles are global). */
export function ConfirmationDialog({
  title,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  titleId = 'confirmation-title',
  danger = false,
  busy = false,
}: ConfirmationDialogProps) {
  useEscapeKey(() => {
    if (!busy) {
      onCancel();
    }
  });

  return (
    <div className="confirmation-backdrop">
      <section className="confirmation-dialog" role="alertdialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId}>{title}</h2>
        {message !== undefined && <p>{message}</p>}
        <div className="confirmation-actions">
          <button type="button" className="confirmation-cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirmation-submit${danger ? ' confirmation-submit--danger' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
