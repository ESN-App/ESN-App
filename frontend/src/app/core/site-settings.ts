import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';
import { DEFAULT_TIME_ZONE, isTimeZone } from '../shared/utils/time-zone';

export interface SiteSettingsDto {
  timeZone: string;
}

/**
 * Site-wide settings (GET /api/settings), loaded once at startup. Until they arrive, or if
 * the request fails (e.g. an API without the endpoint), the defaults stay.
 */
@Injectable({ providedIn: 'root' })
export class SiteSettings {
  /** IANA zone every date/time in the app is shown and entered in. */
  readonly timeZone = signal(DEFAULT_TIME_ZONE);

  constructor() {
    inject(HttpClient)
      .get<Partial<SiteSettingsDto>>(`${environment.apiBaseUrl}/api/settings`)
      .subscribe({ next: (values) => this.apply(values), error: () => undefined });
  }

  /** Applies a valid time zone and ignores anything else. */
  apply(values: Partial<SiteSettingsDto> | null): void {
    const timeZone = values?.timeZone;
    if (isTimeZone(timeZone)) {
      this.timeZone.set(timeZone);
    }
  }
}
