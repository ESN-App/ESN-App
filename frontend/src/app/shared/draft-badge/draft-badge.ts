import { Component } from '@angular/core';

@Component({
  selector: 'app-draft-badge',
  template: '<span>Draft</span>',
  styles: `
    :host {
      display: inline-flex;
      justify-self: start;
      max-width: max-content;
      width: fit-content;
    }

    span {
      background: #dfe1e5;
      border-radius: 999px;
      color: #4f515a;
      display: inline-block;
      font-size: var(--status-badge-font-size, 0.75rem);
      font-weight: 750;
      line-height: var(--status-badge-line-height, 1.35);
      padding: var(--status-badge-padding, 0.3rem 0.55rem);
      white-space: nowrap;
    }
  `,
})
export class DraftBadge {}
