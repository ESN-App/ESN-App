import { indicatorBox } from './sliding-indicator';

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
