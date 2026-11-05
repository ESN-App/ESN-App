/** Splits an offer's discount value for display: "20%" becomes "20%" over "off". */
export function discountParts(value: string | null | undefined): { main: string; sub: string } | null {
  const trimmed = value?.trim();

  if (!trimmed) {
    return null;
  }

  return /^\d+([.,]\d+)?\s*%$/.test(trimmed)
    ? { main: trimmed.replace(/\s+/g, ''), sub: 'off' }
    : { main: trimmed, sub: '' };
}

/** One-line discount label, e.g. "20% off" or "2 for 1". */
export function discountLabel(value: string | null | undefined): string | null {
  const parts = discountParts(value);
  return parts ? `${parts.main}${parts.sub ? ` ${parts.sub}` : ''}` : null;
}

/** Up to two initials for a logo placeholder. */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}
