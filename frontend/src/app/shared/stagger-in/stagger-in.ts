import { DestroyRef, Directive, inject, signal } from '@angular/core';

/**
 * Fades the children of a list in one after another when the list first renders.
 * The class is dropped once the entrance is over, so items added later (search,
 * filters) just appear. The animation itself lives in styles.scss (`.stagger-in`).
 */
@Directive({
  selector: '[appStaggerIn]',
  host: { '[class.stagger-in]': 'active()' },
})
export class StaggerIn {
  protected readonly active = signal(true);

  constructor() {
    const timer = setTimeout(() => this.active.set(false), 800);
    inject(DestroyRef).onDestroy(() => clearTimeout(timer));
  }
}
