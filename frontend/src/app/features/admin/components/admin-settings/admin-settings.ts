import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, linkedSignal, signal } from '@angular/core';
import { SiteSettings } from '../../../../core';
import { formatInZone, utcOffsetLabel } from '../../../../shared';
import { AdminApi } from '../../data-access/admin-api';
import { AdminToast } from '../../utils/admin-toast';
import { AdminFeatures } from '../admin-features/admin-features';
import { AdminSaveLabel } from '../admin-save-label/admin-save-label';
import { AdminVersion } from '../admin-version/admin-version';

const SAVED_LABEL_MS = 2000;

/** Admin "Settings" tab: the site time zone, the feature switches and the deployed versions. */
@Component({
  selector: 'app-admin-settings',
  imports: [AdminFeatures, AdminSaveLabel, AdminVersion],
  templateUrl: './admin-settings.html',
  styleUrl: './admin-settings.scss',
})
export class AdminSettings {
  private readonly api = inject(AdminApi);
  private readonly settings = inject(SiteSettings);
  private readonly toast = inject(AdminToast);

  private readonly now = signal(new Date());
  private readonly clock = setInterval(() => this.now.set(new Date()), 15_000);
  private readonly stopClock = inject(DestroyRef).onDestroy(() => clearInterval(this.clock));

  /** The dropdown value; follows the saved setting until the admin picks another one. */
  protected readonly selected = linkedSignal(() => this.settings.timeZone());
  protected readonly changed = computed(() => this.selected() !== this.settings.timeZone());
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly error = signal<string | null>(null);

  // shortcut: labels show today's offset only (not "CET/CEST"); add DST names if admins ask.
  protected readonly zones = computed(() => {
    const now = new Date();
    const ids = Intl.supportedValuesOf('timeZone');
    const current = this.settings.timeZone();
    return (ids.includes(current) ? ids : [current, ...ids]).map((id) => ({
      id,
      label: `${id} (${utcOffsetLabel(id, now)})`,
    }));
  });
  protected readonly preview = computed(() =>
    formatInZone(this.now(), 'EEE d MMM, HH:mm', this.selected()),
  );

  protected select(event: Event): void {
    this.selected.set((event.target as HTMLSelectElement).value);
    this.error.set(null);
  }

  protected save(): void {
    const timeZone = this.selected();
    this.saving.set(true);
    this.error.set(null);

    this.api.updateSettings({ timeZone }).subscribe({
      next: (saved) => {
        this.settings.apply(saved ?? { timeZone });
        this.saving.set(false);
        this.saved.set(true);
        setTimeout(() => this.saved.set(false), SAVED_LABEL_MS);
        this.toast.show('Time zone saved');
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.error.set(
          error instanceof HttpErrorResponse && error.status === 400
            ? 'That time zone isn’t supported. Choose another one.'
            : 'Couldn’t save the change. Check your connection and try again.',
        );
      },
    });
  }
}
