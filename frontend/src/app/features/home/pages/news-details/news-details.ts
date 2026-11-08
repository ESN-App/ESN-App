import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Skeleton } from '../../../../shared';
import { catchError, map, of, switchMap } from 'rxjs';
import { NewsDetailsView, NewsDetailsViewModel } from '../../components/news-details-view/news-details-view';
import { NewsApi } from '../../data-access/news-api';
import { NewsItemDto } from '../../data-access/news.models';

@Component({
  selector: 'app-news-details',
  imports: [RouterLink, MatIconModule, Skeleton, NewsDetailsView],
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
