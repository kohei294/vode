import type { ListSlide, Project, ScheduleSlide, Slide } from '../types';

function newId(): string {
  return crypto.randomUUID();
}

/** スライドのディープコピー。ネストした id（スケジュール行・リスト項目）も新しくする。 */
export function cloneSlideWithNewIds(slide: Slide): Slide {
  const cloned = JSON.parse(JSON.stringify(slide)) as Slide;
  cloned.id = newId();
  if (cloned.type === 'schedule') {
    const s = cloned as ScheduleSlide;
    s.rows = s.rows.map((row) => ({ ...row, id: newId() }));
  }
  if (cloned.type === 'list') {
    const l = cloned as ListSlide;
    l.items = l.items.map((item) => ({ ...item, id: newId() }));
  }
  return cloned;
}

/** プロジェクトの複製（新 id・タイトルに「（コピー）」・本日の日付）。 */
export function duplicateProject(source: Project): Project {
  const date = new Date().toLocaleDateString('ja-JP').replace(/\//g, '.');
  const baseTitle = source.title.trimEnd();
  const title = `${baseTitle}（コピー）`;
  return {
    ...source,
    id: newId(),
    title,
    date,
    slides: source.slides.map(cloneSlideWithNewIds),
  };
}
