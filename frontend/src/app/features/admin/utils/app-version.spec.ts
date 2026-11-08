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

  it('compares versions when both sides report one', () => {
    expect(versionsDiffer({ version: '0.3.20', commit: 'aaa' }, { version: '0.3.21', commit: 'aaa' })).toBe(true);
    expect(versionsDiffer({ version: '0.3.20', commit: 'aaa' }, { version: '0.3.20', commit: 'bbb' })).toBe(false);
  });

  it('falls back to commits and stays quiet while a side is unknown', () => {
    expect(versionsDiffer({ commit: 'aaa' }, { version: '0.3.20', commit: 'bbb' })).toBe(true);
    expect(versionsDiffer({ commit: 'aaa' }, { commit: 'aaa' })).toBe(false);
    expect(versionsDiffer({ commit: '' }, { commit: 'bbb' })).toBe(false);
    expect(versionsDiffer({ version: '0.3.20', commit: 'aaa' }, null)).toBe(false);
  });
});
