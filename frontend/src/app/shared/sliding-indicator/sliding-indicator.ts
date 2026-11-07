import { afterNextRender, DestroyRef, Directive, ElementRef, inject, input } from '@angular/core';

export interface IndicatorBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Position of `target` inside `host`'s padding box, including the host's scroll offset. */
export function indicatorBox(
  target: Pick<DOMRect, 'left' | 'top' | 'width' | 'height'>,
  host: Pick<DOMRect, 'left' | 'top'>,
  hostEl: Pick<HTMLElement, 'clientLeft' | 'clientTop' | 'scrollLeft' | 'scrollTop'>,
): IndicatorBox {
  return {
    x: target.left - host.left - hostEl.clientLeft + hostEl.scrollLeft,
    y: target.top - host.top - hostEl.clientTop + hostEl.scrollTop,
    width: target.width,
    height: target.height,
  };
}

/**
 * One selection pill that slides between the items of a switch or nav instead of each
 * item painting its own. The value is a CSS selector for the selected element inside
 * the host; its `--indicator-colour` becomes the pill colour. The pill itself is the
 * host's `::before` (styles.scss, `.sliding-indicator`); it only animates after the
 * first paint and after resizes, so it never slides in from nowhere.
 */
@Directive({
  selector: '[appSlidingIndicator]',
  host: { class: 'sliding-indicator' },
})
export class SlidingIndicator {
  readonly target = input.required<string>({ alias: 'appSlidingIndicator' });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    const place = (animate: boolean) => {
      const host = this.host;
      const target = host.querySelector<HTMLElement>(this.target());

      if (!target || target.offsetWidth === 0) {
        host.dataset['indicator'] = 'none';
        return;
      }

      const box = indicatorBox(target.getBoundingClientRect(), host.getBoundingClientRect(), host);
      // Snap (no transition) on first paint, on resize and when the pill reappears.
      const snap = !animate || host.dataset['indicator'] !== 'ready';
      if (snap) {
        delete host.dataset['indicator'];
      }
      host.style.setProperty('--indicator-x', `${box.x}px`);
      host.style.setProperty('--indicator-y', `${box.y}px`);
      host.style.setProperty('--indicator-w', `${box.width}px`);
      host.style.setProperty('--indicator-h', `${box.height}px`);
      host.style.setProperty('--indicator-current', getComputedStyle(target).getPropertyValue('--indicator-colour'));
      if (snap) {
        // Flush styles so the new position lands before the transition is switched on.
        void host.offsetWidth;
      }
      host.dataset['indicator'] = 'ready';
    };

    // Selection changes show up as attribute changes; our own writes (style, data-*) are filtered out.
    const mutations = new MutationObserver(() => place(true));
    const resizes = new ResizeObserver(() => place(false));

    afterNextRender(() => {
      place(false);
      mutations.observe(this.host, {
        subtree: true,
        attributeFilter: ['class', 'aria-selected', 'aria-current', 'aria-pressed'],
      });
      // The items too, so a width change inside a fixed track (e.g. a late web font) re-measures.
      // Observing every item once avoids the initial callback of a newly observed target
      // cancelling the slide on each selection change.
      for (const element of [this.host, ...Array.from(this.host.children)]) {
        resizes.observe(element);
      }
      document.fonts?.ready.then(() => destroyed || place(false));
    });

    let destroyed = false;
    inject(DestroyRef).onDestroy(() => {
      destroyed = true;
      mutations.disconnect();
      resizes.disconnect();
    });
  }
}
