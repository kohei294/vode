import { describe, expect, it } from 'vitest';
import { createEmptySlide } from './createEmptySlide';

describe('createEmptySlide', () => {
  it('creates concept slide', () => {
    const s = createEmptySlide('concept');
    expect(s.type).toBe('concept');
    expect(s.headerTitle).toBe('新しいスライド');
    if (s.type === 'concept') expect(s.pills.length).toBeGreaterThan(0);
  });

  it('creates grid with four columns', () => {
    const s = createEmptySlide('grid');
    expect(s.type).toBe('grid');
    if (s.type === 'grid') expect(s.columns).toHaveLength(4);
  });
});
