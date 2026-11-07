import { Component, input } from '@angular/core';

/** How long "Saved" stays on the button before the form redirects. */
export const SAVED_REDIRECT_DELAY_MS = 700;

/**
 * Submit button content: the label, "Saving…" or "Saved" with a check. All three share one
 * grid cell so the button keeps the width of the longest; hidden ones are left out of the
 * accessible name.
 */
@Component({
  selector: 'app-admin-save-label',
  templateUrl: './admin-save-label.html',
  styleUrl: './admin-save-label.scss',
})
export class AdminSaveLabel {
  readonly label = input.required<string>();
  readonly saving = input(false);
  readonly saved = input(false);
}
