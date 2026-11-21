import { beforeEach, describe, expect, it, vi } from 'vitest';
import { reloadOnChunkError } from './chunk-reload';

describe('reloadOnChunkError', () => {
  const chunkError = {
    error: new TypeError('Failed to fetch dynamically imported module: /chunk-A.js'),
    url: '/events',
  };

  beforeEach(() => sessionStorage.clear());

  it('reloads once, then not again within the guard window', () => {
    const reload = vi.fn();
    expect(reloadOnChunkError(chunkError, reload)).toBe(true);
    expect(reloadOnChunkError(chunkError, reload)).toBe(false);
    expect(reload).toHaveBeenCalledTimes(1);
    expect(reload).toHaveBeenCalledWith('/events');
  });

  it('ignores other errors', () => {
    const reload = vi.fn();
    expect(reloadOnChunkError({ error: new Error('boom'), url: '/x' }, reload)).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
