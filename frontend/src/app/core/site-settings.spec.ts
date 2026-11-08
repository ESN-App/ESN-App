import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { SiteSettings } from './site-settings';

describe('SiteSettings', () => {
  let settings: SiteSettings;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    settings = TestBed.inject(SiteSettings);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('switches to the server time zone once it loads', () => {
    http.expectOne('/api/settings').flush({ timeZone: 'Europe/London' });

    expect(settings.timeZone()).toBe('Europe/London');
  });

  it('keeps Europe/Warsaw when the endpoint is missing or sends an unknown zone', () => {
    http.expectOne('/api/settings').flush(null, { status: 404, statusText: 'Not Found' });
    expect(settings.timeZone()).toBe('Europe/Warsaw');

    settings.apply({ timeZone: 'Mars/Olympus' });
    settings.apply(null);
    expect(settings.timeZone()).toBe('Europe/Warsaw');
  });
});
