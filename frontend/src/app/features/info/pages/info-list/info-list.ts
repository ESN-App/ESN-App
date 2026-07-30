import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith } from 'rxjs';
import { EmptyState, LoadingSpinner } from '../../../../shared';
import { InfoApi, InfoArticleDto } from '../../data-access/info-api';

interface InfoPageState {
  status: 'loading' | 'loaded' | 'error';
  articles: InfoArticleDto[];
}

@Component({
  selector: 'app-info-list',
  imports: [RouterLink, EmptyState, LoadingSpinner],
  templateUrl: './info-list.html',
  styleUrl: './info-list.scss',
})
export class InfoList {
  private readonly api = inject(InfoApi);
  private readonly brokenImageIds = signal<ReadonlySet<string>>(new Set());

  protected readonly state = toSignal(
    this.api.getAll().pipe(
      map(
        (articles): InfoPageState => ({
          status: 'loaded',
          articles: [...articles].sort(
            (left, right) =>
              left.displayOrder - right.displayOrder || left.title.localeCompare(right.title),
          ),
        }),
      ),
      startWith<InfoPageState>({ status: 'loading', articles: [] }),
      catchError(() => of<InfoPageState>({ status: 'error', articles: [] })),
    ),
    { requireSync: true },
  );

  protected hasBrokenImage(articleId: string): boolean {
    return this.brokenImageIds().has(articleId);
  }

  protected markImageAsBroken(articleId: string): void {
    this.brokenImageIds.update((current) => new Set(current).add(articleId));
  }
}
