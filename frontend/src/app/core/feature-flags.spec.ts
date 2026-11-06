import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { FeatureFlags } from './feature-flags';

describe('FeatureFlags', () => {
  let flags: FeatureFlags;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    flags = TestBed.inject(FeatureFlags);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('switches to the server values once they load', () => {
    http.expectOne('/api/features').flush({ pastEventTag: !environment.features.pastEventTag });

    expect(flags.pastEventTag()).toBe(!environment.features.pastEventTag);
  });

  it('keeps the environment default when the request fails or sends junk', () => {
    http.expectOne('/api/features').flush(null, { status: 500, statusText: 'Server Error' });
    expect(flags.pastEventTag()).toBe(environment.features.pastEventTag);

    flags.apply({ pastEventTag: 'yes', unknownFlag: true });
    expect(flags.pastEventTag()).toBe(environment.features.pastEventTag);
  });
});
