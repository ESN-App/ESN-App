import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { LoadingSpinner } from '../../../../shared';
import { PartnersApi } from '../../data-access/partners-api';

@Component({
  selector: 'app-partner-details',
  imports: [RouterLink, LoadingSpinner],
  templateUrl: './partner-details.html',
  styleUrl: './partner-details.scss',
})
export class PartnerDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(PartnersApi);

  protected readonly logoBroken = signal(false);
  protected readonly partner = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        const slug = params.get('partnerSlug');
        return slug ? this.api.getBySlug(slug) : of(null);
      }),
      catchError(() => of(null)),
    ),
  );

  protected initials(name: string): string {
    return name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  protected mapUrl(
    latitude: number | null,
    longitude: number | null,
    fallbackUrl: string | null,
  ): string | null {
    if (latitude !== null && longitude !== null) {
      return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
    }

    return fallbackUrl;
  }
}
