import { describe, expect, it } from 'vitest';
import type { Project } from '../types';
import { cloneSlideWithNewIds, duplicateProject } from './cloneProject';

describe('cloneSlideWithNewIds', () => {
  it('assigns new slide id', () => {
    const slide = {
      id: 'old-slide',
      type: 'concept' as const,
      headerTitle: 'H',
      mainHeadline: 'M',
      pills: [],
      subHeadline: 'S',
      tags: [],
    };
    const copy = cloneSlideWithNewIds(slide);
    expect(copy.id).not.toBe(slide.id);
    expect(copy.headerTitle).toBe('H');
  });

  it('renews schedule row ids', () => {
    const slide = {
      id: 's1',
      type: 'schedule' as const,
      headerTitle: 'H',
      scheduleTitle: 'T',
      rows: [
        {
          id: 'r1',
          time: '1',
          sceneName: 'x',
          image: '',
          staffDetails: '',
          cameraNotes: '',
        },
      ],
    };
    const copy = cloneSlideWithNewIds(slide);
    expect(copy.type).toBe('schedule');
    if (copy.type !== 'schedule') throw new Error('expected schedule');
    expect(copy.rows[0]!.id).not.toBe('r1');
    expect(copy.id).not.toBe('s1');
  });

  it('renews list item ids', () => {
    const slide = {
      id: 'l1',
      type: 'list' as const,
      headerTitle: 'H',
      title: 'T',
      items: [{ id: 'i1', title: 'a', description: 'b' }],
    };
    const copy = cloneSlideWithNewIds(slide);
    expect(copy.type).toBe('list');
    if (copy.type !== 'list') throw new Error('expected list');
    expect(copy.items[0]!.id).not.toBe('i1');
  });
});

describe('duplicateProject', () => {
  it('creates new project id and title suffix', () => {
    const p: Project = {
      id: 'p-old',
      title: '案件A',
      company: 'Co',
      date: '2026.1.1',
      thumbnail: '',
      slides: [
        {
          id: 'sl',
          type: 'concept',
          headerTitle: 'H',
          mainHeadline: 'M',
          pills: [],
          subHeadline: 'S',
          tags: [],
        },
      ],
    };
    const copy = duplicateProject(p);
    expect(copy.id).not.toBe(p.id);
    expect(copy.title).toBe('案件A（コピー）');
    expect(copy.company).toBe('Co');
    expect(copy.slides[0]!.id).not.toBe('sl');
  });
});
