import { afterNextRender, DestroyRef, Directive, ElementRef, inject, Injector, input } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, Router } from '@angular/router';
import { filter, take } from 'rxjs';

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
 * Whether the track itself was resized (window resize, layout change) rather than
 * nudged by a sub-pixel or text-width change of an item becoming selected.
 */
export function trackResized(
  previous: { width: number; height: number } | undefined,
  next: { width: number; height: number },
  tolerance = 2,
): boolean {
  return (
    !previous ||
    Math.abs(previous.width - next.width) > tolerance ||
    Math.abs(previous.height - next.height) > tolerance
  );
}

/**
 * One selection pill that slides between the items of a switch or nav instead of each
 * item painting its own. The value is a CSS selector for the selected element inside
 * the host; its `--indicator-colour` becomes the pill colour. The pill itself is the
 * host's `::before` (styles.scss, `.sliding-indicator`). It snaps into place (no slide)
 * until the router's first navigation has rendered and whenever the track is resized,
 * so it never slides in from nowhere.
 */
@Directive({
  selector: '[appSlidingIndicator]',
  host: { class: 'sliding-indicator' },
})
export class SlidingIndicator {
  readonly target = input.required<string>({ alias: 'appSlidingIndicator' });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  constructor() {
    const router = inject(Router);
    const injector = inject(Injector);
    // Before the first navigation renders, the selection still points at the initial route.
    let settled = router.navigated;

    const place = (animate: boolean) => {
      const host = this.host;
      const target = host.querySelector<HTMLElement>(this.target());

      if (!target || target.offsetWidth === 0) {
        host.dataset['indicator'] = 'none';
        return;
      }

      const box = indicatorBox(target.getBoundingClientRect(), host.getBoundingClientRect(), host);
      // Snap (no transition) on first paint, on resize and when the pill reappears.
      const snap = !animate || !settled || host.dataset['indicator'] !== 'ready';
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
    let trackSize: { width: number; height: number } | undefined;
    // Items are observed too, so a late web font re-measures; their small size changes on
    // selection retarget the running slide, only a real track resize snaps.
    const resizes = new ResizeObserver(() => {
      const { width, height } = this.host.getBoundingClientRect();
      const resized = trackResized(trackSize, { width, height });
      trackSize = { width, height };
      place(!resized);
    });

    afterNextRender(() => {
      place(false);
      mutations.observe(this.host, {
        subtree: true,
        attributeFilter: ['class', 'aria-selected', 'aria-current', 'aria-pressed'],
      });
      for (const element of [this.host, ...Array.from(this.host.children)]) {
        resizes.observe(element);
      }
      document.fonts?.ready.then(() => destroyed || place(true));
    });

    if (!settled) {
      router.events
        .pipe(
          filter((e) => e instanceof NavigationEnd || e instanceof NavigationCancel || e instanceof NavigationError),
          take(1),
        )
        .subscribe(() =>
          afterNextRender(
            () => {
              // Drop the aria-current change of this first render so it snaps, then animate from now on.
              mutations.takeRecords();
              place(false);
              settled = true;
            },
            { injector },
          ),
        );
    }

    let destroyed = false;
    inject(DestroyRef).onDestroy(() => {
      destroyed = true;
      mutations.disconnect();
      resizes.disconnect();
    });
  }
}
