import { Component, computed, inject, signal } from '@angular/core';
import { AppDatePipe } from '../../../../shared';
import { AdminApi, ApiVersionDto } from '../../data-access/admin-api';
import { commitLink, versionsDiffer } from '../../utils/app-version';

/** Which commit the frontend and the API are running, so admins can tell when a deploy is live. */
@Component({
  selector: 'app-admin-version',
  imports: [AppDatePipe],
  templateUrl: './admin-version.html',
  styleUrl: './admin-version.scss',
})
export class AdminVersion {
  private readonly api = inject(AdminApi);

  /** null = not known yet; '' = not deployed ("dev"). */
  private readonly appCommit = signal<string | null>(null);
  /** null = loading or unavailable ("–"). */
  protected readonly apiVersion = signal<ApiVersionDto | null>(null);

  protected readonly appLink = computed(() => {
    const commit = this.appCommit();
    return commit === null ? null : commitLink(commit);
  });
  protected readonly apiLink = computed(() => {
    const version = this.apiVersion();
    return version ? commitLink(version.commit) : null;
  });
  protected readonly differ = computed(() => versionsDiffer(this.appCommit(), this.apiVersion()?.commit));

  constructor() {
    // The dev server has no /version.json: treat a missing or odd response as a dev build.
    this.api.getAppVersion().subscribe({
      next: (version) => this.appCommit.set(typeof version?.commit === 'string' ? version.commit : ''),
      error: () => this.appCommit.set(''),
    });
    // An API without /api/version yet stays unknown ("–").
    this.api.getApiVersion().subscribe({ next: (version) => this.apiVersion.set(version), error: () => undefined });
  }
}
