import { Directive, ElementRef, afterNextRender, inject, signal } from '@angular/core';

/**
 * Hides the image while it loads, so its tinted frame shows; once loaded it fades and
 * settles in (`.image-fade` in styles.scss). Images already in the cache show at once.
 * The frame (parent) supplies the background and must clip the scale (overflow: hidden).
 */
@Directive({
  selector: 'img[appImageFade]',
  host: {
    class: 'image-fade',
    '[class.image-fade--loading]': 'state() === "loading"',
    '[class.image-fade--loaded]': 'state() === "loaded"',
    '(load)': 'onLoad()',
  },
})
export class ImageFade {
  private readonly image = inject<ElementRef<HTMLImageElement>>(ElementRef).nativeElement;
  protected readonly state = signal<'loading' | 'loaded' | 'cached'>('loading');

  constructor() {
    // src is bound by now; a cached image is already complete and skips the animation.
    afterNextRender(() => {
      if (this.image.complete && this.image.naturalWidth > 0) {
        this.state.set('cached');
      }
    });
  }

  protected onLoad(): void {
    if (this.state() === 'loading') {
      this.state.set('loaded');
    }
  }
}
