import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ImageFade } from './image-fade';

@Component({
  imports: [ImageFade],
  template: `<img appImageFade src="/images/test.png" alt="" />`,
})
class Host {}

describe('ImageFade', () => {
  afterEach(() => vi.restoreAllMocks());

  async function render() {
    const fixture = TestBed.createComponent(Host);
    await fixture.whenStable();
    return { fixture, image: fixture.nativeElement.querySelector('img') as HTMLImageElement };
  }

  it('shows the loading tint until the image loads, then animates it in', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(false);
    const { fixture, image } = await render();

    expect(image.classList).toContain('image-fade--loading');
    expect(image.classList).not.toContain('image-fade--loaded');

    image.dispatchEvent(new Event('load'));
    await fixture.whenStable();

    expect(image.classList).not.toContain('image-fade--loading');
    expect(image.classList).toContain('image-fade--loaded');
  });

  it('shows an already loaded (cached) image without animating', async () => {
    vi.spyOn(HTMLImageElement.prototype, 'complete', 'get').mockReturnValue(true);
    vi.spyOn(HTMLImageElement.prototype, 'naturalWidth', 'get').mockReturnValue(100);
    const { fixture, image } = await render();

    image.dispatchEvent(new Event('load'));
    await fixture.whenStable();

    expect(image.classList).toContain('image-fade');
    expect(image.classList).not.toContain('image-fade--loading');
    expect(image.classList).not.toContain('image-fade--loaded');
  });
});
