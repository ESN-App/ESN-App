export function createInfoSlug(title: string): string {
  return (
    title
      .replaceAll('\u0142', 'l')
      .replaceAll('\u0141', 'L')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'article'
  );
}
