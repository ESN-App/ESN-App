import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

/** Full "couldn't load" state with the colour star and a Try again button. */
@Component({
  selector: 'app-error-state',
  imports: [MatIconModule],
  templateUrl: './error-state.html',
  styleUrl: './error-state.scss',
})
export class ErrorState {
  readonly title = input.required<string>();
  readonly message = input('Check your connection and try again.');
  readonly retry = output<void>();
}
