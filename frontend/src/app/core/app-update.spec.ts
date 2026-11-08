import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { NEVER } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AppUpdate, canReloadNow } from './app-update';

describe('canReloadNow', () => {
  it('waits for the next navigation while the tab is visible', () => {
    expect(canReloadNow(false, '/events')).toBe(false);
  });

  it('reloads a hidden tab outside admin forms', () => {
    expect(canReloadNow(true, '/events/42')).toBe(true);
    expect(canReloadNow(true, '/admin')).toBe(true);
  });

  it('never reloads an admin form', () => {
    expect(canReloadNow(true, '/admin/events/new')).toBe(false);
    expect(canReloadNow(true, '/admin/partners/some-slug/edit')).toBe(false);
    expect(canReloadNow(true, '/admin/news/7/edit?tab=1')).toBe(false);
  });
});

describe('AppUpdate', () => {
  function setup(isEnabled: boolean) {
    const swUpdate = {
      isEnabled,
      versionUpdates: NEVER,
      unrecoverable: NEVER,
      checkForUpdate: vi.fn().mockResolvedValue(false),
    };
    TestBed.configureTestingModule({ providers: [provideRouter([]), { provide: SwUpdate, useValue: swUpdate }] });
    TestBed.inject(AppUpdate).start();
    return swUpdate;
  }

  it('checks for an update on start when the service worker is on', () => {
    expect(setup(true).checkForUpdate).toHaveBeenCalledOnce();
  });

  it('does nothing when the service worker is off', () => {
    expect(setup(false).checkForUpdate).not.toHaveBeenCalled();
  });
});
