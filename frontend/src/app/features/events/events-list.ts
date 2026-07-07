import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCardModule } from '@angular/material/card';
import { EmptyState, LoadingSpinner } from '../../shared';
import { EventsApi } from './events-api';

@Component({
  selector: 'app-events-list',
  imports: [DatePipe, MatCardModule, EmptyState, LoadingSpinner],
  template: `
    <h1>Events</h1>

    @if (events(); as loaded) {
      @if (loaded.length === 0) {
        <app-empty-state message="No events yet — check back soon." />
      } @else {
        <div class="card-list">
          @for (event of loaded; track event.id) {
            <mat-card appearance="outlined">
              <mat-card-header>
                <mat-card-title>{{ event.title }}</mat-card-title>
                <mat-card-subtitle>
                  {{ event.startsAt | date: 'medium' }} · {{ event.location }}
                </mat-card-subtitle>
              </mat-card-header>
              <mat-card-content>
                <p>{{ event.description }}</p>
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
export class EventsList {
  readonly events = toSignal(inject(EventsApi).getAll());
}
