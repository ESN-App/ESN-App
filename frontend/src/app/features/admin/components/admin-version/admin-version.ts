import { Component, computed, inject, signal } from '@angular/core';
import { AppDatePipe } from '../../../../shared';
import { AdminApi, ApiVersionDto, AppVersionDto } from '../../data-access/admin-api';
import { commitLink, versionsDiffer } from '../../utils/app-version';

/** Which release the frontend and the API are running, so admins can tell when a deploy is live. */
@Component({
  selector: 'app-admin-version',
  imports: [AppDatePipe],
  templateUrl: './admin-version.html',
  styleUrl: './admin-version.scss',
})
export class AdminVersion {
  private readonly api = inject(AdminApi);

  /** null = not known yet; an empty commit means not deployed ("dev"). */
  protected readonly appVersion = signal<AppVersionDto | null>(null);
  /** null = loading or unavailable ("–"). */
  protected readonly apiVersion = signal<ApiVersionDto | null>(null);

  protected readonly appLink = computed(() => {
    const version = this.appVersion();
    return version ? commitLink(version.commit) : null;
  });
  protected readonly apiLink = computed(() => {
    const version = this.apiVersion();
    return version ? commitLink(version.commit) : null;
  });
  protected readonly differ = computed(() => versionsDiffer(this.appVersion(), this.apiVersion()));

  constructor() {
    // The dev server has no /version.json: treat a missing or odd response as a dev build.
    this.api.getAppVersion().subscribe({
      next: (version) => this.appVersion.set(typeof version === 'object' && version ? version : { version: null, commit: '' }),
      error: () => this.appVersion.set({ version: null, commit: '' }),
    });
    // An API without /api/version yet stays unknown ("–").
    this.api.getApiVersion().subscribe({ next: (version) => this.apiVersion.set(version), error: () => undefined });
  }
}
