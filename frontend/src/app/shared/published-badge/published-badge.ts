import { Component } from '@angular/core';

@Component({
  selector: 'app-published-badge',
  template: '<span>Published</span>',
  styles: `
    :host {
      display: inline-flex;
      justify-self: start;
      max-width: max-content;
      width: fit-content;
    }

    span {
      background: var(--tint-green);
      border-radius: 999px;
      color: var(--app-ink);
      display: inline-block;
      font-size: 0.75rem;
      font-weight: 750;
      line-height: 1.35;
      padding: 0.3rem 0.55rem;
      white-space: nowrap;
    }
  `,
})
export class PublishedBadge {}
