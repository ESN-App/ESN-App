export function createPartnerSlug(name: string): string {
  return (
    name
      .replaceAll('ł', 'l')
      .replaceAll('Ł', 'L')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'partner'
  );
}
