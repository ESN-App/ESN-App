import { Component } from '@angular/core';

/**
 * Shown at the top of a details page when the item is still a draft. Details pages use
 * this instead of the grey card treatment that list items get: on a full page a grey
 * background reads as a broken layout rather than as a status, so the state is stated
 * in words instead.
 */
@Component({
  selector: 'app-draft-preview-banner',
  template: `
    <p class="draft-preview-banner" role="status">
      <span class="draft-preview-banner__badge">Draft</span>
      <span class="draft-preview-banner__text">
        Only administrators can see this page. It is not visible to visitors yet.
      </span>
    </p>
  `,
  styles: `
    :host {
      display: block;
    }

    .draft-preview-banner {
      align-items: center;
      background: #f1f1f2;
      border: 1px solid #cfd1d4;
      // Not a pill. The sentence wraps to two lines in any narrow column (the admin
      // preview panel in both Desktop and Mobile, and real phones), and a 999px radius
      // on a two-line box renders as large semicircular ends. The short DRAFT chip
      // inside stays a pill, which is what that radius is actually suited to.
      border-radius: 1rem;
      color: #4f515a;
      display: flex;
      flex-wrap: wrap;
      font-size: 0.78rem;
      gap: 0.5rem;
      line-height: 1.35;
      // No bottom margin: every details view puts this in a grid with gap: 1rem, so a
      // margin here stacks on top of the gap and doubles the space below the banner.
      margin: 0;
      padding: 0.5rem 0.9rem;
    }

    .draft-preview-banner__badge {
      background: #dfe1e5;
      border-radius: 999px;
      color: #3f414a;
      flex: 0 0 auto;
      font-size: 0.7rem;
      font-weight: 800;
      letter-spacing: 0.04em;
      padding: 0.2rem 0.5rem;
      text-transform: uppercase;
    }

    .draft-preview-banner__text {
      min-width: 0;
    }

    @media (max-width: 700px) {
      .draft-preview-banner {
        font-size: 0.74rem;
      }
    }
  `,
})
export class DraftPreviewBanner {}
