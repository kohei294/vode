import type { ListItem, ListSlide, ScheduleRow, ScheduleSlide } from '../types';
import {
  MAX_BODY,
  MAX_IMAGE_SRC_FIELD,
  MAX_LIST_ITEMS,
  MAX_SCHEDULE_ROWS,
  MAX_SHORT_FIELD,
  MAX_TITLE,
  MAX_URL_FIELD,
} from './projectLimits';
import { safeImageSrc } from './urls';

const LIST_HEADERS = ['title', 'tag', 'description', 'url'] as const;
const SCHEDULE_HEADERS = ['time', 'shootingSubject', 'sceneName', 'image', 'staffDetails', 'cameraNotes'] as const;

export type CsvParseResult<T> =
  | { ok: true; rows: T }
  | { ok: false; error: string };

function cell(v: string | undefined, max: number): string | null {
  const out = (v ?? '').trim();
  if (out.length > max) return null;
  return out;
}

function csvEscape(v: string | undefined): string {
  const s = v ?? '';
  if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(headers: readonly string[], rows: string[][]): string {
  return [
    headers.map(csvEscape).join(','),
    ...rows.map((row) => row.map(csvEscape).join(',')),
  ].join('\r\n');
}

export function exportListSlideCsv(slide: ListSlide): string {
  return rowsToCsv(
    LIST_HEADERS,
    slide.items.map((item) => [item.title, item.tag ?? '', item.description, item.url ?? ''])
  );
}

export function exportScheduleSlideCsv(slide: ScheduleSlide): string {
  return rowsToCsv(
    SCHEDULE_HEADERS,
    slide.rows.map((row) => [
      row.time,
      row.shootingSubject ?? '',
      row.sceneName,
      row.image,
      row.staffDetails,
      row.cameraNotes,
    ])
  );
}

function parseCsv(text: string): CsvParseResult<string[][]> {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i]!;
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(cur);
      cur = '';
    } else if (ch === '\n') {
      row.push(cur);
      rows.push(row);
      row = [];
      cur = '';
    } else if (ch !== '\r') {
      cur += ch;
    }
  }

  if (inQuotes) return { ok: false, error: 'CSV の引用符が閉じていません。' };
  row.push(cur);
  rows.push(row);

  const meaningful = rows.filter((r) => r.some((c) => c.trim() !== ''));
  if (meaningful.length === 0) return { ok: false, error: 'CSV にデータがありません。' };
  return { ok: true, rows: meaningful };
}

function headerMap(header: string[]): Map<string, number> {
  const m = new Map<string, number>();
  header.forEach((h, i) => m.set(h.trim(), i));
  return m;
}

function requireHeaders(map: Map<string, number>, headers: readonly string[]): string | null {
  const missing = headers.filter((h) => !map.has(h));
  return missing.length > 0 ? `CSV の列が足りません: ${missing.join(', ')}` : null;
}

export function parseListItemsCsv(text: string): CsvParseResult<ListItem[]> {
  const parsed = parseCsv(text);
  if (parsed.ok === false) return { ok: false, error: parsed.error };
  const [header, ...data] = parsed.rows;
  const map = headerMap(header ?? []);
  const missing = requireHeaders(map, ['title', 'description', 'url'] as const);
  if (missing) return { ok: false, error: missing };
  if (data.length > MAX_LIST_ITEMS) return { ok: false, error: `リスト項目は最大 ${MAX_LIST_ITEMS} 件までです。` };

  const items: ListItem[] = [];
  for (const row of data) {
    const title = cell(row[map.get('title')!], MAX_TITLE);
    const tag = map.has('tag') ? cell(row[map.get('tag')!], MAX_SHORT_FIELD) : '';
    const description = cell(row[map.get('description')!], MAX_BODY);
    const url = cell(row[map.get('url')!], MAX_URL_FIELD);
    if (title === null || tag === null || description === null || url === null) {
      return { ok: false, error: 'CSV の文字数が上限を超えています。' };
    }
    if (!title && !tag && !description && !url) continue;
    items.push({
      id: crypto.randomUUID(),
      title,
      ...(tag ? { tag } : {}),
      description,
      ...(url ? { url } : {}),
    });
  }
  if (items.length === 0) return { ok: false, error: '読み込めるリスト項目がありません。' };
  return { ok: true, rows: items };
}

export function parseScheduleRowsCsv(text: string): CsvParseResult<ScheduleRow[]> {
  const parsed = parseCsv(text);
  if (parsed.ok === false) return { ok: false, error: parsed.error };
  const [header, ...data] = parsed.rows;
  const map = headerMap(header ?? []);
  const missing = requireHeaders(map, SCHEDULE_HEADERS);
  if (missing) return { ok: false, error: missing };
  if (data.length > MAX_SCHEDULE_ROWS) return { ok: false, error: `スケジュール行は最大 ${MAX_SCHEDULE_ROWS} 件までです。` };

  const rows: ScheduleRow[] = [];
  for (const row of data) {
    const time = cell(row[map.get('time')!], MAX_SHORT_FIELD);
    const shootingSubject = cell(row[map.get('shootingSubject')!], MAX_SHORT_FIELD);
    const sceneName = cell(row[map.get('sceneName')!], MAX_BODY);
    const imageRaw = cell(row[map.get('image')!], MAX_IMAGE_SRC_FIELD);
    const staffDetails = cell(row[map.get('staffDetails')!], MAX_BODY);
    const cameraNotes = cell(row[map.get('cameraNotes')!], MAX_BODY);
    if (
      time === null ||
      shootingSubject === null ||
      sceneName === null ||
      imageRaw === null ||
      staffDetails === null ||
      cameraNotes === null
    ) {
      return { ok: false, error: 'CSV の文字数が上限を超えています。' };
    }
    if (!time && !shootingSubject && !sceneName && !imageRaw && !staffDetails && !cameraNotes) continue;
    const image = imageRaw ? safeImageSrc(imageRaw) ?? '' : '';
    rows.push({
      id: crypto.randomUUID(),
      time,
      ...(shootingSubject ? { shootingSubject } : {}),
      sceneName,
      image,
      staffDetails,
      cameraNotes,
    });
  }
  if (rows.length === 0) return { ok: false, error: '読み込めるスケジュール行がありません。' };
  return { ok: true, rows };
}
