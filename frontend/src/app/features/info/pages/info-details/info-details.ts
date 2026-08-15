import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, of, switchMap } from 'rxjs';
import { LoadingSpinner } from '../../../../shared';
import { InfoDetailsView } from '../../components/info-details-view/info-details-view';
import { InfoApi } from '../../data-access/info-api';

@Component({
  selector: 'app-info-details',
  imports: [RouterLink, InfoDetailsView, LoadingSpinner],
  templateUrl: './info-details.html',
  styleUrl: './info-details.scss',
})
export class InfoDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(InfoApi);

  protected readonly article = toSignal(
    this.route.paramMap.pipe(
      switchMap((params) => {
        const slug = params.get('articleSlug');
        return slug ? this.api.getBySlug(slug) : of(null);
      }),
      catchError(() => of(null)),
    ),
  );
}
