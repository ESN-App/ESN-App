import { eventMapUrl } from './event-map';

describe('eventMapUrl', () => {
  it('creates a Google Maps search URL from coordinates', () => {
    expect(eventMapUrl(54.352, 18.6466, null)).toBe(
      'https://www.google.com/maps/search/?api=1&query=54.352,18.6466',
    );
  });

  it('uses the supplied maps URL when coordinates are unavailable', () => {
    expect(eventMapUrl(null, null, 'https://maps.google.com/?q=Gdańsk')).toBe(
      'https://maps.google.com/?q=Gdańsk',
    );
  });

  it('returns null without coordinates or a maps URL', () => {
    expect(eventMapUrl(null, null, null)).toBeNull();
  });
});
