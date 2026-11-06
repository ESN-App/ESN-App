import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject, catchError, map, of, startWith, switchMap } from 'rxjs';
import { EmptyState, ErrorState, LoadingSpinner } from '../../../../shared';
import { InfoListItem } from '../../components/info-list-item/info-list-item';
import { InfoApi, InfoArticleDto } from '../../data-access/info-api';

interface InfoPageState {
  status: 'loading' | 'loaded' | 'error';
  articles: InfoArticleDto[];
}

@Component({
  selector: 'app-info-list',
  imports: [EmptyState, ErrorState, InfoListItem, LoadingSpinner, MatIconModule],
  templateUrl: './info-list.html',
  styleUrl: './info-list.scss',
})
export class InfoList {
  private readonly api = inject(InfoApi);

  // Emits on start and on every "Try again".
  private readonly reload$ = new BehaviorSubject<void>(undefined);

  protected readonly state = toSignal(
    this.reload$.pipe(
      switchMap(() =>
        this.api.getAll().pipe(
          map(
            (articles): InfoPageState => ({
              status: 'loaded',
              // Server order: manual DisplayOrder, then newest first.
              articles,
            }),
          ),
          startWith<InfoPageState>({ status: 'loading', articles: [] }),
          catchError(() => of<InfoPageState>({ status: 'error', articles: [] })),
        ),
      ),
    ),
    { requireSync: true },
  );

  protected readonly searchQuery = signal('');
  protected readonly filteredArticles = computed(() => {
    const query = this.searchQuery().trim().toLocaleLowerCase();
    const articles = this.state().articles;

    return query
      ? articles.filter((article) =>
          `${article.title} ${article.category} ${article.content}`
            .toLocaleLowerCase()
            .includes(query),
        )
      : articles;
  });
  protected readonly tints = ['orange', 'cyan', 'green', 'magenta'];

  protected updateSearch(event: Event): void {
    this.searchQuery.set((event.currentTarget as HTMLInputElement).value);
  }

  protected retry(): void {
    this.reload$.next();
  }
}
