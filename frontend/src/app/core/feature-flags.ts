import { Injectable, signal } from '@angular/core';
import { environment } from '../../environments/environment';

/** The one place components read feature flags from. */
@Injectable({ providedIn: 'root' })
export class FeatureFlags {
  /** #33: "This event has ended" tag on past events. */
  readonly pastEventTag = signal(environment.features.pastEventTag);
}
