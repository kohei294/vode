import { describe, expect, it } from 'vitest';
import { validateImportedProjects } from './projectValidate';

const minimalValidProject = {
  id: 'p1',
  title: 'テスト',
  company: '会社',
  date: '2026.01.01',
  thumbnail: '',
  slides: [
    {
      id: 's1',
      type: 'concept',
      headerTitle: 'H',
      mainHeadline: 'M',
      pills: ['a'],
      subHeadline: 'S',
      tags: ['t'],
    },
  ],
};

describe('validateImportedProjects', () => {
  it('accepts minimal valid payload', () => {
    const out = validateImportedProjects([minimalValidProject]);
    expect(out).not.toBeNull();
    expect(out).toHaveLength(1);
    expect(out![0].slides[0].type).toBe('concept');
  });

  it('rejects non-array', () => {
    expect(validateImportedProjects({})).toBeNull();
    expect(validateImportedProjects(null)).toBeNull();
  });

  it('rejects unknown slide type', () => {
    const bad = {
      ...minimalValidProject,
      slides: [{ id: 'x', type: 'typo', headerTitle: 'h' }],
    };
    expect(validateImportedProjects([bad])).toBeNull();
  });

  it('rejects empty projects array', () => {
    expect(validateImportedProjects([])).toBeNull();
  });

  it('strips non-http(s) thumbnail URLs on import', () => {
    const withBadThumb = {
      ...minimalValidProject,
      thumbnail: 'javascript:alert(1)',
    };
    const out = validateImportedProjects([withBadThumb]);
    expect(out).not.toBeNull();
    expect(out![0].thumbnail).toBe('');
  });

  it('keeps valid https thumbnail on import', () => {
    const withThumb = {
      ...minimalValidProject,
      thumbnail: 'https://example.com/thumb.png',
    };
    const out = validateImportedProjects([withThumb]);
    expect(out).not.toBeNull();
    expect(out![0].thumbnail).toBe('https://example.com/thumb.png');
  });
});
