import { describe, expect, it } from 'vitest';
import type { ListSlide, ScheduleSlide } from '../types';
import {
  exportListSlideCsv,
  exportScheduleSlideCsv,
  parseListItemsCsv,
  parseScheduleRowsCsv,
} from './slideCsv';

describe('slideCsv', () => {
  it('exports and imports list slide CSV with escaped values', () => {
    const slide: ListSlide = {
      id: 's1',
      type: 'list',
      headerTitle: 'List',
      title: 'T',
      items: [
        {
          id: 'i1',
          title: 'A, "quoted"',
          description: 'line1\nline2',
          url: 'https://example.com',
        },
      ],
    };
    const csv = exportListSlideCsv(slide);
    expect(csv).toContain('"A, ""quoted"""');
    const parsed = parseListItemsCsv(csv);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.rows[0]).toMatchObject({
        title: 'A, "quoted"',
        description: 'line1\nline2',
        url: 'https://example.com',
      });
      expect(parsed.rows[0]!.id).not.toBe('i1');
    }
  });

  it('exports and imports schedule slide CSV', () => {
    const slide: ScheduleSlide = {
      id: 's1',
      type: 'schedule',
      headerTitle: 'Schedule',
      scheduleTitle: '撮影',
      rows: [
        {
          id: 'r1',
          time: '10:00',
          shootingSubject: '商品',
          sceneName: 'メイン',
          image: 'https://example.com/a.png',
          staffDetails: 'A',
          cameraNotes: 'B',
        },
      ],
    };
    const parsed = parseScheduleRowsCsv(exportScheduleSlideCsv(slide));
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.rows[0]).toMatchObject({
        time: '10:00',
        shootingSubject: '商品',
        sceneName: 'メイン',
        image: 'https://example.com/a.png',
        staffDetails: 'A',
        cameraNotes: 'B',
      });
    }
  });

  it('rejects missing headers', () => {
    const parsed = parseListItemsCsv('title,description\nA,B');
    expect(parsed.ok).toBe(false);
    if (parsed.ok === false) expect(parsed.error).toContain('url');
  });

  it('strips unsafe schedule image values', () => {
    const parsed = parseScheduleRowsCsv(
      'time,shootingSubject,sceneName,image,staffDetails,cameraNotes\n10:00,x,y,javascript:alert(1),a,b'
    );
    expect(parsed.ok).toBe(true);
    if (parsed.ok) expect(parsed.rows[0]!.image).toBe('');
  });
});
