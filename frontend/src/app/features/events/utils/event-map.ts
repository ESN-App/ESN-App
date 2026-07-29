export function eventMapUrl(
  latitude: number | null,
  longitude: number | null,
  fallbackUrl: string | null,
): string | null {
  if (latitude !== null && longitude !== null) {
    return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  }

  return fallbackUrl;
}
