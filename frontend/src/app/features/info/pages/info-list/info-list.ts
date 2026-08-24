import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of, startWith } from 'rxjs';
import { EmptyState, LoadingSpinner } from '../../../../shared';
import { InfoListItem } from '../../components/info-list-item/info-list-item';
import { InfoApi, InfoArticleDto } from '../../data-access/info-api';

interface InfoPageState {
  status: 'loading' | 'loaded' | 'error';
  articles: InfoArticleDto[];
}

@Component({
  selector: 'app-info-list',
  imports: [EmptyState, InfoListItem, LoadingSpinner],
  templateUrl: './info-list.html',
  styleUrl: './info-list.scss',
})
export class InfoList {
  private readonly api = inject(InfoApi);

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
}
