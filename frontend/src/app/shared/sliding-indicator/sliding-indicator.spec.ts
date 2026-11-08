import { indicatorBox, trackResized } from './sliding-indicator';

describe('trackResized', () => {
  it('treats the first measurement as a resize', () => {
    expect(trackResized(undefined, { width: 300, height: 44 })).toBe(true);
  });

  it('ignores the sub-pixel and text-width nudges of a selection change', () => {
    expect(trackResized({ width: 480, height: 40 }, { width: 480.8, height: 40 })).toBe(false);
  });

  it('reports a real track resize', () => {
    expect(trackResized({ width: 480, height: 40 }, { width: 350, height: 40 })).toBe(true);
    expect(trackResized({ width: 480, height: 40 }, { width: 480, height: 68 })).toBe(true);
  });
});

describe('indicatorBox', () => {
  it('places the target inside the host padding box', () => {
    expect(
      indicatorBox(
        { left: 120, top: 58, width: 56, height: 32 },
        { left: 20, top: 50 },
        { clientLeft: 1, clientTop: 1, scrollLeft: 0, scrollTop: 0 },
      ),
    ).toEqual({ x: 99, y: 7, width: 56, height: 32 });
  });

  it('adds the host scroll offset so the pill scrolls with a scrolled track', () => {
    expect(
      indicatorBox(
        { left: 10, top: 5, width: 80, height: 40 },
        { left: 0, top: 0 },
        { clientLeft: 0, clientTop: 0, scrollLeft: 150, scrollTop: 0 },
      ),
    ).toEqual({ x: 160, y: 5, width: 80, height: 40 });
  });
});
