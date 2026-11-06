import { formatDate } from '@angular/common';

export interface EditTracked {
  createdAt: string;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}

export interface EditMeta {
  /** ISO timestamp shown in line 1, for `<time datetime>`. */
  at: string;
  /** "Edited" or "Created" (never edited). */
  verb: 'Edited' | 'Created';
  /** "6 Nov 2026, 21:40" */
  date: string;
  /** "Jan K." or "—" */
  by: string;
  /** "Edited 6 Nov 2026, 21:40 by Jan K." */
  line: string;
  /** "Created by Maria K." — only for edited items. */
  createdLine: string | null;
  /** Screen-reader sentence; says "unknown" where the visual text shows "—". */
  label: string;
}

/** Sort key of the "Last edited" column. */
export const lastChangedAt = (item: EditTracked): number => Date.parse(item.updatedAt ?? item.createdAt);

export function editMeta(item: EditTracked): EditMeta {
  const edited = item.updatedAt != null;
  const at = item.updatedAt ?? item.createdAt;
  const by = (edited ? item.updatedBy ?? item.createdBy : item.createdBy) ?? null;
  const verb = edited ? 'Edited' : 'Created';
  const date = formatDate(at, 'd MMM y, HH:mm', 'en-US');
  const when = `${verb} ${date}`;
  return {
    at,
    verb,
    date,
    by: by ?? '—',
    line: `${when} by ${by ?? '—'}`,
    createdLine: edited ? `Created by ${item.createdBy ?? '—'}` : null,
    label: `${when} by ${by ?? 'unknown'}${edited ? `, created by ${item.createdBy ?? 'unknown'}` : ''}`,
  };
}
