import { describe, expect, it } from 'vitest';
import { urlHost } from './url-host';

describe('urlHost', () => {
  it('returns the host without www', () => {
    expect(urlHost('https://www.pueblo-burrito.pl/menu?x=1')).toBe('pueblo-burrito.pl');
    expect(urlHost('https://ztm.gda.pl')).toBe('ztm.gda.pl');
  });

  it('falls back to the input when it is not a URL', () => {
    expect(urlHost('not a url')).toBe('not a url');
  });
});
