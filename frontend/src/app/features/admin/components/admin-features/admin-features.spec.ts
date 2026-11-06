import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { FeatureFlags } from '../../../../core';
import { AdminFeatures } from './admin-features';

describe('AdminFeatures', () => {
  let http: HttpTestingController;
  let flags: FeatureFlags;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    http = TestBed.inject(HttpTestingController);
    flags = TestBed.inject(FeatureFlags);
    http.expectOne('/api/features').flush({ pastEventTag: true });
  });

  afterEach(() => http.verify());

  function render() {
    const fixture = TestBed.createComponent(AdminFeatures);
    http
      .expectOne('/api/admin/features')
      .flush([{ key: 'pastEventTag', enabled: true, updatedAt: '2026-11-06T18:00:00+00:00' }]);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button[role="switch"]').click();
    fixture.detectChanges();
    return fixture;
  }

  it('sends the new value and updates the student-side flag straight away', () => {
    render();
    const request = http.expectOne('/api/admin/features/pastEventTag');

    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ enabled: false });
    expect(flags.pastEventTag()).toBe(false);
    request.flush({ key: 'pastEventTag', enabled: false, updatedAt: '2026-11-06T19:00:00+00:00' });
  });

  it('rolls back and shows an error when saving fails', () => {
    const fixture = render();
    http
      .expectOne('/api/admin/features/pastEventTag')
      .flush(null, { status: 500, statusText: 'Server Error' });
    fixture.detectChanges();

    expect(flags.pastEventTag()).toBe(true);
    expect(fixture.nativeElement.querySelector('button[role="switch"]').getAttribute('aria-checked')).toBe('true');
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Couldn’t save');
  });
});
