import { commitLink, versionsDiffer } from './app-version';

describe('app version', () => {
  it('links a commit by its short SHA', () => {
    expect(commitLink('1a2b3c4d5e6f')).toEqual({
      label: '1a2b3c4',
      url: 'https://github.com/ESN-App/ESN-App/commit/1a2b3c4d5e6f',
    });
  });

  it('shows "dev" without a link when there is no commit', () => {
    expect(commitLink('')).toEqual({ label: 'dev', url: null });
    expect(commitLink(null)).toEqual({ label: 'dev', url: null });
  });

  it('flags a mismatch only when both commits are known', () => {
    expect(versionsDiffer('aaa', 'bbb')).toBe(true);
    expect(versionsDiffer('aaa', 'aaa')).toBe(false);
    expect(versionsDiffer('', 'bbb')).toBe(false);
    expect(versionsDiffer('aaa', null)).toBe(false);
  });
});
