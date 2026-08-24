import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { LoadingSpinner } from '../../../../shared';
import { NewsDetailsView, NewsDetailsViewModel } from '../../components/news-details-view/news-details-view';
import { NewsApi } from '../../data-access/news-api';
import { NewsItemDto } from '../../data-access/news.models';

@Component({
  selector: 'app-news-details',
  imports: [RouterLink, LoadingSpinner, NewsDetailsView],
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

  protected detailsView(item: NewsItemDto): NewsDetailsViewModel {
    return {
      id: item.id,
      title: item.title,
      description: item.description,
      imagePath: item.imagePath || null,
      createdAt: item.createdAt,
      status: item.status,
    };
  }
}
