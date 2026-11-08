import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/** Confirms an admin action with a short toast (styled by `.admin-toast` in styles.scss). */
@Injectable({ providedIn: 'root' })
export class AdminToast {
  private readonly snackBar = inject(MatSnackBar);

  show(message: string): void {
    this.snackBar.open(message, 'Dismiss', { duration: 4000, panelClass: 'admin-toast' });
  }
}

/** "Event deleted" for one, "3 events deleted" for more. */
export function countMessage(count: number, singular: string, plural: string, verb: string): string {
  return count === 1
    ? `${singular.charAt(0).toUpperCase()}${singular.slice(1)} ${verb}`
    : `${count} ${plural} ${verb}`;
}
