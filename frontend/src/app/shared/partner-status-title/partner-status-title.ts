import { Component, input } from '@angular/core';
import { DraftBadge } from '../draft-badge/draft-badge';
import { InactiveBadge } from '../inactive-badge/inactive-badge';

@Component({
  selector: 'app-partner-status-title',
  imports: [DraftBadge, InactiveBadge],
  template: `
    <div class="title-row">
      <ng-content />
      @if (status() === 0) {
        <app-draft-badge />
      } @else if (status() === 2) {
        <app-inactive-badge />
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
export class PartnerStatusTitle {
  readonly status = input.required<number>();
}
