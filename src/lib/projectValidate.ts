import type {
  ConceptSlide,
  CustomSlide,
  GridColumn,
  GridSlide,
  ListItem,
  ListSlide,
  Project,
  ScheduleRow,
  ScheduleSlide,
  Slide,
  SlideType,
  SplitSlide,
} from '../types';
import {
  MAX_BODY,
  MAX_GRID_COLUMNS,
  MAX_HEADER_TITLE,
  MAX_ID_LEN,
  MAX_LIST_ITEMS,
  MAX_PILLS,
  MAX_PROJECTS,
  MAX_RIGHT_LIST_LINES,
  MAX_SCHEDULE_ROWS,
  MAX_SHORT_FIELD,
  MAX_SLIDES_PER_PROJECT,
  MAX_TAGS,
  MAX_TITLE,
  MAX_IMAGE_SRC_FIELD,
  MAX_URL_FIELD,
  isAllowedCustomLayout,
} from './projectLimits';
import { safeImageSrc } from './urls';

const SLIDE_TYPES: Set<SlideType> = new Set([
  'concept',
  'grid',
  'split',
  'schedule',
  'list',
  'custom',
]);

function s(v: unknown, max: number): string | null {
  if (typeof v !== 'string') return null;
  if (v.length > max) return null;
  return v;
}

function sOpt(v: unknown, max: number): string | undefined {
  if (v === undefined || v === null) return undefined;
  const x = s(v, max);
  if (x === null || x === '') return undefined;
  return x;
}

function stringArray(v: unknown, maxItems: number, maxEach: number): string[] | null {
  if (!Array.isArray(v)) return null;
  if (v.length > maxItems) return null;
  const out: string[] = [];
  for (const item of v) {
    const t = s(item, maxEach);
    if (t === null) return null;
    out.push(t);
  }
  return out;
}

function baseSlide(o: Record<string, unknown>): { id: string; headerTitle: string; type: SlideType } | null {
  const id = s(o.id, MAX_ID_LEN);
  const headerTitle = s(o.headerTitle, MAX_HEADER_TITLE);
  const typeRaw = s(o.type, 32);
  if (!id || !headerTitle || !typeRaw || !SLIDE_TYPES.has(typeRaw as SlideType)) return null;
  return { id, headerTitle, type: typeRaw as SlideType };
}

function conceptSlide(o: Record<string, unknown>): ConceptSlide | null {
  const b = baseSlide(o);
  if (!b || b.type !== 'concept') return null;
  const mainHeadline = s(o.mainHeadline, MAX_BODY);
  const subHeadline = s(o.subHeadline, MAX_TITLE);
  const pills = stringArray(o.pills, MAX_PILLS, MAX_SHORT_FIELD);
  const tags = stringArray(o.tags, MAX_TAGS, MAX_SHORT_FIELD);
  if (!mainHeadline || !subHeadline || !pills || !tags) return null;
  return { ...b, type: 'concept', mainHeadline, subHeadline, pills, tags };
}

function gridColumn(o: unknown): GridColumn | null {
  if (typeof o !== 'object' || o === null) return null;
  const r = o as Record<string, unknown>;
  const title = s(r.title, MAX_TITLE);
  const details = s(r.details, MAX_BODY);
  const descriptionTitle = s(r.descriptionTitle, MAX_TITLE);
  const descriptionText = s(r.descriptionText, MAX_BODY);
  if (!title || !details || !descriptionTitle || !descriptionText) return null;
  return { title, details, descriptionTitle, descriptionText };
}

function gridSlide(o: Record<string, unknown>): GridSlide | null {
  const b = baseSlide(o);
  if (!b || b.type !== 'grid') return null;
  if (!Array.isArray(o.columns) || o.columns.length === 0 || o.columns.length > MAX_GRID_COLUMNS) return null;
  const columns: GridColumn[] = [];
  for (const c of o.columns) {
    const col = gridColumn(c);
    if (!col) return null;
    columns.push(col);
  }
  return { ...b, type: 'grid', columns };
}

function splitSlide(o: Record<string, unknown>): SplitSlide | null {
  const b = baseSlide(o);
  if (!b || b.type !== 'split') return null;
  const leftImageRaw = s(o.leftImage, MAX_IMAGE_SRC_FIELD) ?? '';
  const leftImage = leftImageRaw.trim() === '' ? '' : (safeImageSrc(leftImageRaw) ?? '');
  const leftSubtext = s(o.leftSubtext, MAX_TITLE) ?? '';
  const badge = s(o.badge, MAX_TITLE);
  const rightHeading = s(o.rightHeading, MAX_TITLE);
  const rightSubheading = s(o.rightSubheading, MAX_TITLE);
  const rightDescription = s(o.rightDescription, MAX_BODY);
  let rightList: string[];
  if (o.rightList === undefined || o.rightList === null) {
    rightList = [];
  } else {
    const rl = stringArray(o.rightList, MAX_RIGHT_LIST_LINES, MAX_BODY);
    if (!rl) return null;
    rightList = rl;
  }
  if (!badge || !rightHeading || !rightSubheading || !rightDescription) return null;
  return {
    ...b,
    type: 'split',
    leftImage,
    leftSubtext,
    badge,
    rightHeading,
    rightSubheading,
    rightDescription,
    rightList,
  };
}

function scheduleRow(o: unknown): ScheduleRow | null {
  if (typeof o !== 'object' || o === null) return null;
  const r = o as Record<string, unknown>;
  const id = s(r.id, MAX_ID_LEN);
  const time = s(r.time, MAX_SHORT_FIELD);
  const sceneName = s(r.sceneName, MAX_BODY);
  const imageRaw = s(r.image, MAX_IMAGE_SRC_FIELD) ?? '';
  const image = imageRaw.trim() === '' ? '' : (safeImageSrc(imageRaw) ?? '');
  const staffDetails = s(r.staffDetails, MAX_BODY) ?? '';
  const cameraNotes = s(r.cameraNotes, MAX_BODY) ?? '';
  if (!id || !time || !sceneName) return null;
  const row: ScheduleRow = { id, time, sceneName, image, staffDetails, cameraNotes };
  const shootingSubjectNew = sOpt(r.shootingSubject, MAX_SHORT_FIELD);
  const shootingSubjectLegacy = sOpt(r.duration, MAX_SHORT_FIELD);
  const shootingSubject =
    shootingSubjectNew !== undefined ? shootingSubjectNew : shootingSubjectLegacy;
  if (shootingSubject !== undefined) row.shootingSubject = shootingSubject;
  return row;
}

function scheduleSlide(o: Record<string, unknown>): ScheduleSlide | null {
  const b = baseSlide(o);
  if (!b || b.type !== 'schedule') return null;
  const scheduleTitle = s(o.scheduleTitle, MAX_TITLE) ?? '';
  if (!Array.isArray(o.rows) || o.rows.length > MAX_SCHEDULE_ROWS) return null;
  const rows: ScheduleRow[] = [];
  for (const row of o.rows) {
    const rr = scheduleRow(row);
    if (!rr) return null;
    rows.push(rr);
  }
  return { ...b, type: 'schedule', scheduleTitle, rows };
}

function listItem(o: unknown): ListItem | null {
  if (typeof o !== 'object' || o === null) return null;
  const r = o as Record<string, unknown>;
  const id = s(r.id, MAX_ID_LEN);
  const title = s(r.title, MAX_TITLE);
  const description = s(r.description, MAX_BODY);
  if (!id || !title || !description) return null;
  const urlRaw = sOpt(r.url, MAX_URL_FIELD);
  if (urlRaw === undefined) return { id, title, description };
  return { id, title, description, url: urlRaw };
}

function listSlide(o: Record<string, unknown>): ListSlide | null {
  const b = baseSlide(o);
  if (!b || b.type !== 'list') return null;
  const title = s(o.title, MAX_TITLE);
  if (!title) return null;
  if (!Array.isArray(o.items) || o.items.length > MAX_LIST_ITEMS) return null;
  const items: ListItem[] = [];
  for (const it of o.items) {
    const li = listItem(it);
    if (!li) return null;
    items.push(li);
  }
  return { ...b, type: 'list', title, items };
}

function customSlide(o: Record<string, unknown>): CustomSlide | null {
  const b = baseSlide(o);
  if (!b || b.type !== 'custom') return null;
  const title = s(o.title, MAX_TITLE) ?? '';
  const content = s(o.content, MAX_BODY) ?? '';
  const imageRaw = s(o.image, MAX_IMAGE_SRC_FIELD) ?? '';
  const image = imageRaw.trim() === '' ? '' : (safeImageSrc(imageRaw) ?? '');
  const layoutRaw = o.layout;
  let layout: CustomSlide['layout'] | undefined;
  if (layoutRaw !== undefined && layoutRaw !== null) {
    const ls = s(layoutRaw, 64);
    if (!ls || !isAllowedCustomLayout(ls)) return null;
    layout = ls as CustomSlide['layout'];
  }
  const image2Raw = o.image2;
  const image2Stored =
    image2Raw !== undefined && image2Raw !== null ? s(image2Raw, MAX_IMAGE_SRC_FIELD) ?? '' : undefined;
  const image2 =
    image2Stored === undefined || image2Stored.trim() === ''
      ? undefined
      : (safeImageSrc(image2Stored) ?? '');

  const slide: CustomSlide = { ...b, type: 'custom', title, content, image };
  if (layout !== undefined) slide.layout = layout;
  if (image2 !== undefined && image2 !== '') slide.image2 = image2;
  return slide;
}

function oneSlide(o: unknown): Slide | null {
  if (typeof o !== 'object' || o === null) return null;
  const r = o as Record<string, unknown>;
  const type = s(r.type, 32);
  if (!type) return null;
  switch (type) {
    case 'concept':
      return conceptSlide(r);
    case 'grid':
      return gridSlide(r);
    case 'split':
      return splitSlide(r);
    case 'schedule':
      return scheduleSlide(r);
    case 'list':
      return listSlide(r);
    case 'custom':
      return customSlide(r);
    default:
      return null;
  }
}

function oneProject(o: unknown): Project | null {
  if (typeof o !== 'object' || o === null) return null;
  const p = o as Record<string, unknown>;
  const id = s(p.id, MAX_ID_LEN);
  const title = s(p.title, MAX_TITLE);
  const company = s(p.company, MAX_TITLE);
  const date = s(p.date, MAX_SHORT_FIELD);
  const thumbRaw = s(p.thumbnail, MAX_IMAGE_SRC_FIELD) ?? '';
  const thumbnail =
    thumbRaw.trim() === '' ? '' : (safeImageSrc(thumbRaw) ?? '');
  if (!id || !title || !company || !date) return null;
  if (!Array.isArray(p.slides) || p.slides.length > MAX_SLIDES_PER_PROJECT) return null;
  const slides: Slide[] = [];
  for (const sl of p.slides) {
    const slide = oneSlide(sl);
    if (!slide) return null;
    slides.push(slide);
  }
  return { id, title, company, date, thumbnail, slides };
}

/** 検証済みデータをプロトタイプ汚染のないプレーン JSON 経由で複製する */
function cloneValidatedProjects(projects: Project[]): Project[] {
  return JSON.parse(JSON.stringify(projects)) as Project[];
}

/** パース後の unknown に対して厳密検証。失敗時は null */
export function validateImportedProjects(data: unknown): Project[] | null {
  if (!Array.isArray(data) || data.length === 0 || data.length > MAX_PROJECTS) return null;
  const out: Project[] = [];
  for (const item of data) {
    const proj = oneProject(item);
    if (!proj) return null;
    out.push(proj);
  }
  return cloneValidatedProjects(out);
}
