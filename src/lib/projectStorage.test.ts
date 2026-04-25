import { describe, expect, it } from 'vitest';
import { parseProjectImportJson, parseProjectsJson } from './projectStorage';

const project = {
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

describe('projectStorage JSON parsers', () => {
  it('keeps storage parser array-only for localStorage compatibility', () => {
    expect(parseProjectsJson(JSON.stringify(project))).toBeNull();
    expect(parseProjectsJson(JSON.stringify([project]))).toHaveLength(1);
  });

  it('accepts single project or project array for user import', () => {
    expect(parseProjectImportJson(JSON.stringify(project))).toHaveLength(1);
    expect(parseProjectImportJson(JSON.stringify([project]))).toHaveLength(1);
  });
});
