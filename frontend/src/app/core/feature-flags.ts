import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal, WritableSignal } from '@angular/core';
import { environment } from '../../environments/environment';

/**
 * The one place components read feature flags from. Starts with the environment values and
 * switches to the server's (GET /api/features) once they arrive; on failure the defaults stay.
 */
@Injectable({ providedIn: 'root' })
export class FeatureFlags {
  /** #33: "This event has ended" tag on past events. */
  readonly pastEventTag = signal(environment.features.pastEventTag);

  private readonly flags: Record<string, WritableSignal<boolean>> = {
    pastEventTag: this.pastEventTag,
  };

  constructor() {
    inject(HttpClient)
      .get<Record<string, unknown>>(`${environment.apiBaseUrl}/api/features`)
      .subscribe({ next: (values) => this.apply(values), error: () => undefined });
  }

  /** Applies known boolean flags and ignores anything else. */
  apply(values: Record<string, unknown> | null): void {
    for (const [key, value] of Object.entries(values ?? {})) {
      if (typeof value === 'boolean' && Object.hasOwn(this.flags, key)) {
        this.flags[key].set(value);
      }
    }
  }
}
