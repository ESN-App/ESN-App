import { Component, input } from '@angular/core';
import { CancelledBadge } from '../cancelled-badge/cancelled-badge';
import { DraftBadge } from '../draft-badge/draft-badge';

@Component({
  selector: 'app-event-status-title',
  imports: [CancelledBadge, DraftBadge],
  template: `
    <div class="title-row">
      <ng-content />
      @if (status() === 0) {
        <app-draft-badge />
      } @else if (status() === 2) {
        <app-cancelled-badge />
      }
    </div>
  `,
  styles: `
    .title-row {
      align-items: center;
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      min-width: 0;
    }
  `,
})
export class EventStatusTitle {
  readonly status = input.required<number>();
}
