import { Location } from '@angular/common';
import { DestroyRef, Directive, ElementRef, inject } from '@angular/core';
import { Router } from '@angular/router';

/**
 * For a details page's Back link (`routerLink` to its list): when the previous page in this
 * session was that list, goes back in history instead, so the list keeps its scroll position
 * and the route transition plays as "back". Otherwise (deep link) the routerLink is followed.
 */
@Directive({ selector: 'a[appBackLink]' })
export class BackLink {
  constructor() {
    const link = inject<ElementRef<HTMLAnchorElement>>(ElementRef).nativeElement;
    const router = inject(Router);
    const location = inject(Location);

    const onClick = (event: MouseEvent) => {
      const previous = router.lastSuccessfulNavigation()?.previousNavigation?.finalUrl;
      const plainClick =
        event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
      if (plainClick && previous && router.serializeUrl(previous).split('?')[0] === link.pathname) {
        event.preventDefault();
        event.stopImmediatePropagation();
        location.back();
      }
    };
    // Capture phase: runs before RouterLink's own click handler on the same element.
    link.addEventListener('click', onClick, { capture: true });
    inject(DestroyRef).onDestroy(() =>
      link.removeEventListener('click', onClick, { capture: true }),
    );
  }
}
