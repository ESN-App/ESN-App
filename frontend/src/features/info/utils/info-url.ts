export function createInfoSlug(title: string): string {
  return (
    title
      .replaceAll('ł', 'l')
      .replaceAll('Ł', 'L')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'article'
  );
}
