import { Component, computed, input } from '@angular/core';

export type SkeletonVariant =
  | 'events'
  | 'news'
  | 'guides'
  | 'partners'
  | 'event-detail'
  | 'partner-detail'
  | 'admin-form'
  | 'admin-preview'
  | 'table';

/**
 * Placeholder blocks shaped like the real cards and rows of each list, so nothing jumps
 * when the data arrives. The tint and shimmer come from the global `.skeleton` class.
 */
@Component({
  selector: 'app-skeleton',
  templateUrl: './skeleton.html',
  styleUrl: './skeleton.scss',
  host: {
    role: 'status',
    'aria-label': 'Loading',
    '[class]': '"skeleton-" + variant()',
  },
})
export class Skeleton {
  readonly variant = input.required<SkeletonVariant>();
  readonly count = input(3);
  protected readonly items = computed(() => Array.from({ length: this.count() }, (_, index) => index));
}
