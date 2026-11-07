// List <-> details shared-element route transition (#30). Styles: "List -> details" in styles.scss.

export type DetailDirection = 'forward' | 'back';

const DETAIL_PATH = /^(events|partners|info|news)\/[^/]+$/;
const HERO_NAME = 'hero-image';

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
 * Names the list item's image and the details hero `hero-image` for one transition, so the
 * image grows into the hero (or shrinks back). Only one element carries the name in each
 * snapshot; without a match on the list side the page just slides/fades.
 */
export function animateDetailTransition(
  transition: ViewTransition,
  direction: DetailDirection,
  detailPath: string,
): void {
  const root = document.documentElement;
  const listImage = () => findListImage(detailPath);
  const hero = () => document.querySelector<HTMLElement>('.details-page .detail-hero');
  // Reduced motion: no hero morph, the page only cross-fades (styles.scss).
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const [oldElement, findNewElement] = reducedMotion
    ? [null, () => null]
    : direction === 'forward'
      ? [listImage(), hero]
      : [hero(), listImage];
  let newElement: HTMLElement | null = null;

  root.classList.add(`vt-${direction}`);
  // The old snapshot is taken on the next frame, so naming now still counts.
  if (oldElement) {
    oldElement.style.viewTransitionName = HERO_NAME;
    // The new DOM is rendered (skeleton hero if data is still loading) but not yet captured.
    transition.updateCallbackDone.then(() => {
      oldElement.style.viewTransitionName = '';
      newElement = findNewElement();
      if (newElement) {
        newElement.style.viewTransitionName = HERO_NAME;
      }
    }, noop);
  }

  const cleanup = () => {
    root.classList.remove(`vt-${direction}`);
    if (oldElement) {
      oldElement.style.viewTransitionName = '';
    }
    if (newElement) {
      newElement.style.viewTransitionName = '';
    }
  };
  transition.finished.then(cleanup, cleanup);
}

function findListImage(detailPath: string): HTMLElement | null {
  for (const link of document.querySelectorAll<HTMLAnchorElement>('a[href]')) {
    if (decodeURIComponent(link.pathname) !== `/${detailPath}`) {
      continue;
    }
    const image = link.closest('.card')?.querySelector<HTMLElement>('[data-hero-source]');
    if (image) {
      return image;
    }
  }
  return null;
}

function noop(): void {
  // Navigation cancelled: the transition is skipped and cleanup runs on `finished`.
}
