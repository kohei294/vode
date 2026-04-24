import { describe, expect, it } from 'vitest';
import { SLIDE_CANVAS_H, SLIDE_CANVAS_W } from './slideDimensions';

describe('slideDimensions', () => {
  it('matches A4 landscape aspect (297:210)', () => {
    const ratio = SLIDE_CANVAS_W / SLIDE_CANVAS_H;
    const a4Landscape = 297 / 210;
    expect(Math.abs(ratio - a4Landscape)).toBeLessThan(1e-9);
  });

  it('height is exact fraction of width for A4 landscape', () => {
    expect(SLIDE_CANVAS_H).toBe((SLIDE_CANVAS_W * 210) / 297);
  });
});
