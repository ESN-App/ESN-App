import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { EmptyState, LoadingSpinner } from '../../shared';
import { DiscountsApi } from './discounts-api';

@Component({
  selector: 'app-discounts-list',
  imports: [MatCardModule, EmptyState, LoadingSpinner],
  template: `
    <h1>Discounts</h1>

    @if (discounts(); as loaded) {
      @if (loaded.length === 0) {
        <app-empty-state message="No discounts yet — check back soon." />
      } @else {
        <div class="card-list">
          @for (discount of loaded; track discount.id) {
            <mat-card appearance="outlined">
              <mat-card-header>
                <mat-card-title>{{ discount.title }}</mat-card-title>
                @if (discount.partnerName) {
                  <mat-card-subtitle>{{ discount.partnerName }}</mat-card-subtitle>
                }
              </mat-card-header>
              <mat-card-content>
                <p>{{ discount.description }}</p>
              </mat-card-content>
            </mat-card>
          }
        </div>
      }
    } @else {
      <app-loading-spinner />
    }
  `,
  styles: `
    .card-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
  `,
})
export class DiscountsList {
  readonly discounts = toSignal(inject(DiscountsApi).getAll());
}
