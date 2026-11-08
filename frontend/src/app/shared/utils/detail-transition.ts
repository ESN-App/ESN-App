// List <-> details shared-element route transition (#30). Styles: "List -> details" in styles.scss.

export type DetailDirection = 'forward' | 'back';

const DETAIL_PATH = /^(events|partners|info|news)\/[^/]+$/;

let lastTransitionDone: Promise<void> = Promise.resolve();

/** Records the running route transition (app.config.ts) for `routeTransitionDone`. */
export function trackRouteTransition(transition: ViewTransition): void {
  lastTransitionDone = transition.finished.then(noop, noop);
}

/**
 * Resolves once the running route transition has finished. A navigation started earlier
 * (e.g. a query param redirect while the page opens) would abort it.
 */
export function routeTransitionDone(): Promise<void> {
  return lastTransitionDone;
}

function noop(): void {
  // Only the timing matters.
}

/**
 * 'forward' when a details page opens from a non-details page; 'back' when a details page
 * returns to its list (Back link) or the browser goes back; null for everything else
 * (tab switches keep the plain cross-fade). Paths have no leading slash, '' is home.
 */
export function detailDirection(
  from: string,
  to: string,
  popstate: boolean,
): DetailDirection | null {
  const fromDetail = DETAIL_PATH.exec(from);
  if (DETAIL_PATH.test(to)) {
    return fromDetail ? null : 'forward';
  }
  if (!fromDetail) {
    return null;
  }
  const list = fromDetail[1] === 'news' ? '' : fromDetail[1];
  return popstate || to === list ? 'back' : null;
}

/**
 * CSS naming `hero-image` the list image of the card linking to `detailPath`
 * (`[data-hero-source]`) and the details image or logo (`[data-hero-target]`). The list
 * and the details page are never on screen together, so each snapshot has at most one.
 */
export function heroRules(detailPath: string): string {
  // Escaped for a double-quoted CSS string.
  const href = `/${detailPath}`.replace(/["\\]/g, '\\$&');
  // routerLink hrefs, with or without preserved query params.
  const link = `a[href="${href}"], a[href^="${href}?"]`;
  return `.details-page [data-hero-target],
.card:not(:has(.card)):has(${link}) [data-hero-source],
:is(${link}).card [data-hero-source] { view-transition-name: hero-image; }`;
}

/**
 * Plays the list <-> details transition: the list image grows into the details image (or
 * shrinks back) while the page slides. Names come from a temporary stylesheet rather than
 * inline styles, so the new page's elements carry them the moment they render, before the
 * new snapshot. With no image on either side there is no shared element, only the slide.
 */
export function animateDetailTransition(
  transition: ViewTransition,
  direction: DetailDirection,
  detailPath: string,
): void {
  const root = document.documentElement;
  const rules = document.createElement('style');
  // Reduced motion: no morph, the page only cross-fades (styles.scss).
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    rules.textContent = heroRules(detailPath);
  }
  document.head.append(rules);
  root.classList.add(`vt-${direction}`);

  const cleanup = () => {
    rules.remove();
    root.classList.remove(`vt-${direction}`);
  };
  transition.finished.then(cleanup, cleanup);
}
