import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { EmptyState, LoadingSpinner } from '../../shared';
import { InfoApi } from './info-api';

@Component({
  selector: 'app-info-list',
  imports: [MatCardModule, EmptyState, LoadingSpinner],
  template: `
    <div class="page-heading">
      <img src="/images/esnstar.png" alt="" />
      <h1>Info</h1>
    </div>

    @if (articles(); as loaded) {
      @if (loaded.length === 0) {
        <app-empty-state message="No articles yet — check back soon." />
      } @else {
        <div class="card-list">
          @for (article of loaded; track article.id) {
            <mat-card appearance="outlined">
              <mat-card-header>
                <mat-card-title>{{ article.title }}</mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <p>{{ article.content }}</p>
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
export class InfoList {
  readonly articles = toSignal(inject(InfoApi).getAll());
}
