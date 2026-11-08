import { inject, Pipe, PipeTransform } from '@angular/core';
import { SiteSettings } from '../../core/site-settings';
import { formatInZone } from '../utils/time-zone';

/**
 * `| date` for instants, in the site time zone (DatePipe's timezone only takes fixed offsets).
 * Impure so a changed setting re-renders; it only runs on change detection and is cheap.
 */
@Pipe({ name: 'appDate', pure: false })
export class AppDatePipe implements PipeTransform {
  private readonly settings = inject(SiteSettings);

  transform(value: Date | string | number | null | undefined, format: string): string {
    return formatInZone(value, format, this.settings.timeZone());
  }
}
