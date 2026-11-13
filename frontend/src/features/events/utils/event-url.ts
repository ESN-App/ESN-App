const GUID_AT_END =
  /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;

export function createEventSlug(title: string, id: string): string {
  const readableTitle =
    title
      .trim()
      .toLowerCase()
      .replaceAll('ł', 'l')
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'event';

  return `${readableTitle}-${id.toLowerCase()}`;
}

export function extractEventId(urlSegment: string): string | null {
  return GUID_AT_END.exec(urlSegment)?.[1] ?? null;
}
