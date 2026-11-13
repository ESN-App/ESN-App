/** Same as the Angular `optionalAbsoluteUrl` validator: empty passes, otherwise it must parse as a URL. */
export function isOptionalAbsoluteUrl(value: string | null | undefined): boolean {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    return true;
  }
  try {
    new URL(trimmed);
    return true;
  } catch {
    return false;
  }
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Parses an `<input type="number">` value like Angular's NumberValueAccessor (empty → null). */
export function parseNumber(value: string): number | null {
  return value === '' ? null : Number(value);
}
