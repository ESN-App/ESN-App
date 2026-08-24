import { eventMapUrl } from './event-map';

describe('eventMapUrl', () => {
  it('returns the supplied Google Maps URL', () => {
    expect(eventMapUrl('https://maps.google.com/?q=Gdańsk')).toBe(
      'https://maps.google.com/?q=Gdańsk',
    );
  });

  it('returns null when no URL is supplied', () => {
    expect(eventMapUrl(null)).toBeNull();
  });
});
