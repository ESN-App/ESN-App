import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FeatureFlags } from '../../../../core';
import { AdminApi, FeatureFlagDto } from '../../data-access/admin-api';

const LABELS: Record<string, string> = {
  pastEventTag: 'Show “This event has ended” on past events (#33, temporary)',
};

/** Feature switches for everyone; changes apply to the student side without a reload. */
@Component({
  selector: 'app-admin-features',
  imports: [DatePipe, MatSlideToggleModule],
  templateUrl: './admin-features.html',
  styleUrl: './admin-features.scss',
})
export class AdminFeatures {
  private readonly api = inject(AdminApi);
  private readonly featureFlags = inject(FeatureFlags);

  protected readonly flags = signal<FeatureFlagDto[] | null>(null);
  protected readonly loadFailed = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly savingKey = signal<string | null>(null);

  constructor() {
    this.api.getFeatures().subscribe({
      next: (flags) => this.flags.set(flags),
      error: () => this.loadFailed.set(true),
    });
  }

  protected label(key: string): string {
    return LABELS[key] ?? key;
  }

  /** Optimistic: flip it right away, roll back if the server says no. */
  protected toggle(flag: FeatureFlagDto, enabled: boolean): void {
    this.error.set(null);
    this.savingKey.set(flag.key);
    this.replace({ ...flag, enabled });
    this.featureFlags.apply({ [flag.key]: enabled });

    this.api.updateFeature(flag.key, enabled).subscribe({
      next: (saved) => {
        this.replace(saved);
        this.savingKey.set(null);
      },
      error: () => {
        this.replace(flag);
        this.featureFlags.apply({ [flag.key]: flag.enabled });
        this.error.set('Couldn’t save the change. Check your connection and try again.');
        this.savingKey.set(null);
      },
    });
  }

  private replace(flag: FeatureFlagDto): void {
    this.flags.update((flags) => flags?.map((item) => (item.key === flag.key ? flag : item)) ?? null);
  }
}
