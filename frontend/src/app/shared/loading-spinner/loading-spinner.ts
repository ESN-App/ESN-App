import { Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  imports: [MatProgressSpinnerModule],
  template: `
    <div class="loading-spinner">
      <mat-spinner diameter="48" />
    </div>
  `,
  styles: `
    .loading-spinner {
      display: flex;
      justify-content: center;
      padding: 2rem;
    }
  `,
})
export class LoadingSpinner {}
