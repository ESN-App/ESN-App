import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { LoadingSpinner } from '../../../../shared';
import { NewsApi } from '../../data-access/news-api';

@Component({
  selector: 'app-news-details',
  imports: [DatePipe, RouterLink, LoadingSpinner],
  templateUrl: './news-details.html',
  styleUrl: './news-details.scss',
})
export class NewsDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(NewsApi);

  readonly newsItem = toSignal(
    this.route.paramMap.pipe(
      map((params) => params.get('newsId')),
      switchMap((id) => (id ? this.api.getById(id) : of(null))),
      catchError(() => of(null)),
    ),
  );

  hideBrokenImage(event: Event): void {
    const image = event.currentTarget as HTMLImageElement;
    image.closest('.hero')?.classList.add('no-image');
    image.closest('.hero-image')?.remove();
  }
}
