import React, { useLayoutEffect, useRef } from 'react';
import { Slide, ConceptSlide, GridSlide, SplitSlide, ScheduleSlide, ListSlide, CustomSlide } from '../types';
import { SLIDE_CANVAS_H, SLIDE_CANVAS_W } from '../lib/slideDimensions';
import { safeExternalHref, safeImageSrc } from '../lib/urls';
import { CF } from '../lib/canvasEditorFieldIds';
import { cn } from '../lib/utils';

export type SlideGlobalSettings = {
  targetCompany?: string;
  creationDate?: string;
};

export type SlideCanvasEditHandler = (updater: (slide: Slide) => void) => void;

export type SlideCanvasFieldLinkHandlers = {
  onFieldFocus: (fieldId: string) => void;
  onFieldBlur: () => void;
};

type CanvasProps = {
  onCanvasEdit?: SlideCanvasEditHandler;
  canvasFieldLink?: SlideCanvasFieldLinkHandlers;
  linkedFieldId?: string | null;
};

function normalizeEditableText(s: string) {
  return s.replace(/\r\n/g, '\n');
}

function readEditableText(el: HTMLElement) {
  return normalizeEditableText(el.textContent ?? '');
}

function CanvasEditableText({
  fieldId,
  value,
  commit,
  className,
  multiline,
  as: Tag = 'div',
  style,
  onCanvasEdit,
  canvasFieldLink,
  linkedFieldId,
}: {
  fieldId: string;
  value: string;
  commit: (next: string) => void;
  className?: string;
  multiline?: boolean;
  as?: keyof React.JSX.IntrinsicElements;
  style?: React.CSSProperties;
  onCanvasEdit?: SlideCanvasEditHandler;
  canvasFieldLink?: SlideCanvasFieldLinkHandlers;
  linkedFieldId?: string | null;
}) {
  const ref = useRef<HTMLElement | null>(null);
  const focusedRef = useRef(false);
  const editable = Boolean(onCanvasEdit);
  const linked = linkedFieldId !== null && linkedFieldId !== undefined && linkedFieldId === fieldId;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !editable) return;
    if (focusedRef.current) return;
    const cur = readEditableText(el);
    const v = normalizeEditableText(value);
    if (cur !== v) {
      el.textContent = value;
    }
  }, [value, editable]);

  if (!editable) {
    return React.createElement(Tag, { className, style }, value);
  }

  const onFocus = () => {
    focusedRef.current = true;
    canvasFieldLink?.onFieldFocus(fieldId);
  };

  const onBlur = () => {
    focusedRef.current = false;
    window.setTimeout(() => {
      const ae = document.activeElement;
      if (!ae?.closest('[data-vode-canvas-field]')) {
        canvasFieldLink?.onFieldBlur();
      }
    }, 0);
  };

  const onInput = () => {
    const el = ref.current;
    if (!el) return;
    commit(readEditableText(el));
  };

  const onPaste = (e: React.ClipboardEvent<HTMLElement>) => {
    e.preventDefault();
    const text = normalizeEditableText(e.clipboardData.getData('text/plain'));
    if (!text) return;
    const el = ref.current;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return;
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    range.setStartAfter(node);
    range.setEndAfter(node);
    range.collapse(false);
    sel.removeAllRanges();
    sel.addRange(range);
    commit(readEditableText(el));
  };

  return React.createElement(Tag, {
    ref: ref as React.Ref<HTMLElement>,
    style,
    'data-vode-canvas-field': fieldId,
    contentEditable: true,
    suppressContentEditableWarning: true,
    spellCheck: false,
    className: cn(
      className,
      multiline && 'whitespace-pre-wrap',
      'cursor-text rounded-sm outline-none transition-[box-shadow,background-color] duration-150',
      linked && 'bg-[#5b5c64]/12 shadow-[inset_0_0_0_2px_rgba(91,92,100,0.35)]',
      'focus-visible:bg-[#5b5c64]/8 focus-visible:shadow-[inset_0_0_0_2px_rgba(28,28,30,0.25)]'
    ),
    onFocus,
    onBlur,
    onInput,
    onPaste,
    onKeyDown: (e: React.KeyboardEvent) => {
      if (!multiline && e.key === 'Enter') {
        e.preventDefault();
        (e.target as HTMLElement).blur();
      }
    },
  });
}

export function SlideRenderer({
  slide,
  globalSettings = {},
  onCanvasEdit,
  canvasFieldLink,
  linkedFieldId = null,
}: {
  slide: Slide;
  globalSettings?: SlideGlobalSettings;
  onCanvasEdit?: SlideCanvasEditHandler;
  canvasFieldLink?: SlideCanvasFieldLinkHandlers;
  /** 右パネルや別キャンバス要素と同期したハイライト用 */
  linkedFieldId?: string | null;
}) {
  const canvas: CanvasProps = { onCanvasEdit, canvasFieldLink, linkedFieldId };

  return (
    <div className="vode-slide-print-page inline-block max-w-none">
      <div
        className="vode-slide-print-canvas relative flex flex-col overflow-hidden border border-[#5b5c64]/20 bg-[#FFFFFF] font-sans text-[#1C1C1E] print:border-0 print:shadow-none group"
        style={{ width: SLIDE_CANVAS_W, height: SLIDE_CANVAS_H }}
      >
        <div className="absolute inset-x-0 top-0 z-30 border-b border-[#5b5c64]/12 bg-[#FFFFFF] px-10 pb-2.5 pt-7 sm:px-12 sm:pt-8">
          <div className="flex items-start justify-between gap-6 sm:gap-8">
            <div className="min-w-0 flex-1 pr-2">
              <CanvasEditableText
                as="h2"
                fieldId={CF.headerTitle}
                value={slide.headerTitle}
                commit={(next) => onCanvasEdit?.((s) => { s.headerTitle = next; })}
                onCanvasEdit={onCanvasEdit}
                canvasFieldLink={canvasFieldLink}
                linkedFieldId={linkedFieldId}
                className="text-sm font-semibold tracking-wide text-[#5b5c64] leading-snug"
              />
            </div>
            <div className="flex max-w-[min(100%,28rem)] shrink-0 flex-row flex-wrap items-center justify-end gap-x-2.5 gap-y-1 text-right sm:gap-x-3">
              {globalSettings.targetCompany && (
                <span className="truncate text-sm font-bold leading-snug tracking-wide text-[#1C1C1E] sm:text-base">
                  {globalSettings.targetCompany}
                </span>
              )}
              {globalSettings.targetCompany && globalSettings.creationDate && (
                <span className="hidden h-3.5 w-px shrink-0 bg-[#5b5c64]/25 sm:block" aria-hidden />
              )}
              {globalSettings.creationDate && (
                <span className="whitespace-nowrap rounded-md bg-[#f4f4f5] px-2.5 py-1 text-[11px] font-medium leading-none text-[#5b5c64] sm:text-xs sm:px-3 sm:py-1.5">
                  作成日: {globalSettings.creationDate}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex h-full w-full flex-1 px-12 pb-12 pt-[4.85rem] sm:pt-[5rem]">
          {slide.type === 'concept' && <ConceptSlideRenderer slide={slide} {...canvas} />}
          {slide.type === 'grid' && <GridSlideRenderer slide={slide} {...canvas} />}
          {slide.type === 'split' && <SplitSlideRenderer slide={slide} {...canvas} />}
          {slide.type === 'schedule' && <ScheduleSlideRenderer slide={slide} {...canvas} />}
          {slide.type === 'list' && <ListSlideRenderer slide={slide} {...canvas} />}
          {slide.type === 'custom' && <CustomSlideRenderer slide={slide} {...canvas} />}
        </div>
      </div>
    </div>
  );
}

function ConceptSlideRenderer({ slide, ...canvas }: { slide: ConceptSlide } & CanvasProps) {
  const { onCanvasEdit, canvasFieldLink, linkedFieldId } = canvas;
  return (
    <div className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-[#5b5c64]/10 bg-[#FFFFFF] p-14 shadow-sm group">
      <div className="relative z-10 flex w-full max-w-[58rem] flex-col items-center">
        <CanvasEditableText
          as="h1"
          fieldId={CF.mainHeadline}
          value={slide.mainHeadline}
          commit={(next) => onCanvasEdit?.((s) => { if (s.type === 'concept') s.mainHeadline = next; })}
          onCanvasEdit={onCanvasEdit}
          canvasFieldLink={canvasFieldLink}
          linkedFieldId={linkedFieldId}
          multiline
          className="mb-12 text-center text-[2.65rem] font-black leading-[1.12] tracking-tighter text-[#1C1C1E] sm:text-5xl"
        />

        <div className="mb-14 flex flex-wrap justify-center gap-3">
          {slide.pills.map((pill, i) => (
            <React.Fragment key={i}>
              <CanvasEditableText
                as="div"
                fieldId={CF.pills}
                value={pill}
                commit={(next) =>
                  onCanvasEdit?.((s) => {
                    if (s.type !== 'concept') return;
                    const nextPills = [...s.pills];
                    nextPills[i] = next;
                    s.pills = nextPills;
                  })
                }
                onCanvasEdit={onCanvasEdit}
                canvasFieldLink={canvasFieldLink}
                linkedFieldId={linkedFieldId}
                className="rounded-full border border-[#1C1C1E]/50 bg-[#FFFFFF] px-6 py-2 text-sm font-bold tracking-wider text-[#1C1C1E] shadow-sm"
              />
            </React.Fragment>
          ))}
        </div>

        <CanvasEditableText
          as="h3"
          fieldId={CF.subHeadline}
          value={slide.subHeadline}
          commit={(next) => onCanvasEdit?.((s) => { if (s.type === 'concept') s.subHeadline = next; })}
          onCanvasEdit={onCanvasEdit}
          canvasFieldLink={canvasFieldLink}
          linkedFieldId={linkedFieldId}
          className="mb-16 text-3xl font-bold text-[#1C1C1E]"
        />

        <div className="flex max-w-4xl flex-wrap justify-center gap-2.5 sm:gap-3">
          {(slide.tags || []).map((tag, i) => (
            <React.Fragment key={i}>
              <CanvasEditableText
                as="div"
                fieldId={CF.tags}
                value={tag}
                commit={(next) =>
                  onCanvasEdit?.((s) => {
                    if (s.type !== 'concept') return;
                    const tags = [...(s.tags || [])];
                    tags[i] = next;
                    s.tags = tags;
                  })
                }
                onCanvasEdit={onCanvasEdit}
                canvasFieldLink={canvasFieldLink}
                linkedFieldId={linkedFieldId}
                className="rounded-lg border border-[#5b5c64]/30 bg-[#FFFFFF] px-4 py-2 text-xs font-medium text-[#5b5c64] shadow-sm"
              />
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

function GridSlideRenderer({ slide, ...canvas }: { slide: GridSlide } & CanvasProps) {
  const { onCanvasEdit, canvasFieldLink, linkedFieldId } = canvas;
  return (
    <div className="flex h-full w-full flex-col justify-center">
      <div className="grid h-full grid-cols-12 gap-7">
        {slide.columns.map((col, i) => (
          <div key={i} className="relative col-span-3 flex flex-col rounded-xl border border-[#5b5c64]/10 bg-[#FFFFFF] p-8 shadow-sm group">
            <CanvasEditableText
              as="h3"
              fieldId={CF.grid(i, 'title')}
              value={col.title}
              commit={(next) => onCanvasEdit?.((s) => { if (s.type === 'grid') s.columns[i].title = next; })}
              onCanvasEdit={onCanvasEdit}
              canvasFieldLink={canvasFieldLink}
              linkedFieldId={linkedFieldId}
              className="mb-4 text-lg font-bold text-[#1C1C1E]"
            />
            <div className="flex flex-1 flex-col">
              <CanvasEditableText
                as="div"
                fieldId={CF.grid(i, 'details')}
                value={col.details}
                commit={(next) => onCanvasEdit?.((s) => { if (s.type === 'grid') s.columns[i].details = next; })}
                onCanvasEdit={onCanvasEdit}
                canvasFieldLink={canvasFieldLink}
                linkedFieldId={linkedFieldId}
                multiline
                className="min-h-[120px] flex-1 pt-4 text-xl font-medium leading-relaxed text-[#1C1C1E]"
              />
              <div className="mt-6 border-t border-[#5b5c64]/20 pt-6">
                <CanvasEditableText
                  as="h4"
                  fieldId={CF.grid(i, 'descriptionTitle')}
                  value={col.descriptionTitle}
                  commit={(next) => onCanvasEdit?.((s) => { if (s.type === 'grid') s.columns[i].descriptionTitle = next; })}
                  onCanvasEdit={onCanvasEdit}
                  canvasFieldLink={canvasFieldLink}
                  linkedFieldId={linkedFieldId}
                  className="mb-4 text-sm font-bold text-[#1C1C1E]"
                />
                <CanvasEditableText
                  as="p"
                  fieldId={CF.grid(i, 'descriptionText')}
                  value={col.descriptionText}
                  commit={(next) => onCanvasEdit?.((s) => { if (s.type === 'grid') s.columns[i].descriptionText = next; })}
                  onCanvasEdit={onCanvasEdit}
                  canvasFieldLink={canvasFieldLink}
                  linkedFieldId={linkedFieldId}
                  multiline
                  className="text-sm leading-relaxed text-[#5b5c64]"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SplitSlideRenderer({ slide, ...canvas }: { slide: SplitSlide } & CanvasProps) {
  const { onCanvasEdit, canvasFieldLink, linkedFieldId } = canvas;
  const leftSrc = safeImageSrc(slide.leftImage);
  return (
    <div className="grid h-full w-full grid-cols-12 items-center gap-12">
      <div className="col-span-5 flex h-full flex-col rounded-2xl bg-[#FFFFFF] p-6 relative">
        <div className="relative mb-4 flex-1 min-h-[300px] w-full overflow-hidden rounded-xl border border-[#5b5c64]/10 bg-[#FFFFFF] sm:min-h-[360px]">
          {leftSrc ? (
            <img src={leftSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 m-4 flex items-center justify-center rounded-xl border-2 border-dashed border-[#5b5c64]/30">
              <p className="text-sm text-[#5b5c64]">画像エリア</p>
            </div>
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#1C1C1E]/80 to-transparent p-6">
            <CanvasEditableText
              as="div"
              fieldId={CF.splitLeftSubtext}
              value={slide.leftSubtext || ''}
              commit={(next) => onCanvasEdit?.((s) => { if (s.type === 'split') s.leftSubtext = next; })}
              onCanvasEdit={onCanvasEdit}
              canvasFieldLink={canvasFieldLink}
              linkedFieldId={linkedFieldId}
              className="text-sm font-medium text-[#FFFFFF]"
            />
          </div>
        </div>

        {slide.rightList && slide.rightList.length > 0 && (
          <div className="mt-4 space-y-2 rounded-xl border border-[#5b5c64]/10 bg-[#FFFFFF] p-5 text-sm text-[#1C1C1E]">
            {slide.rightList.map((item, i) => (
              <React.Fragment key={i}>
                <CanvasEditableText
                  as="p"
                  fieldId={CF.splitRightList}
                  value={item}
                  commit={(next) =>
                    onCanvasEdit?.((s) => {
                      if (s.type !== 'split') return;
                      const list = [...(s.rightList || [])];
                      list[i] = next;
                      s.rightList = list;
                    })
                  }
                  onCanvasEdit={onCanvasEdit}
                  canvasFieldLink={canvasFieldLink}
                  linkedFieldId={linkedFieldId}
                  multiline
                  className="font-medium leading-relaxed"
                />
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      <div className="col-span-7 flex h-full flex-col justify-center pr-8">
        <CanvasEditableText
          as="div"
          fieldId={CF.splitBadge}
          value={slide.badge}
          commit={(next) => onCanvasEdit?.((s) => { if (s.type === 'split') s.badge = next; })}
          onCanvasEdit={onCanvasEdit}
          canvasFieldLink={canvasFieldLink}
          linkedFieldId={linkedFieldId}
          className="mb-6 inline-block w-max rounded bg-[#1C1C1E] px-3 py-1 text-xs font-bold text-[#FFFFFF]"
        />
        <CanvasEditableText
          as="h2"
          fieldId={CF.splitRightHeading}
          value={slide.rightHeading}
          commit={(next) => onCanvasEdit?.((s) => { if (s.type === 'split') s.rightHeading = next; })}
          onCanvasEdit={onCanvasEdit}
          canvasFieldLink={canvasFieldLink}
          linkedFieldId={linkedFieldId}
          multiline
          className="mb-8 text-5xl font-black leading-tight tracking-tight text-[#1C1C1E]"
        />

        <CanvasEditableText
          as="h3"
          fieldId={CF.splitRightSubheading}
          value={slide.rightSubheading}
          commit={(next) => onCanvasEdit?.((s) => { if (s.type === 'split') s.rightSubheading = next; })}
          onCanvasEdit={onCanvasEdit}
          canvasFieldLink={canvasFieldLink}
          linkedFieldId={linkedFieldId}
          className="mb-8 inline-block w-full border-b border-[#5b5c64]/30 pb-4 text-2xl font-bold text-[#1C1C1E]"
        />

        <CanvasEditableText
          as="p"
          fieldId={CF.splitRightDescription}
          value={slide.rightDescription}
          commit={(next) => onCanvasEdit?.((s) => { if (s.type === 'split') s.rightDescription = next; })}
          onCanvasEdit={onCanvasEdit}
          canvasFieldLink={canvasFieldLink}
          linkedFieldId={linkedFieldId}
          multiline
          className="text-lg leading-relaxed text-[#5b5c64]"
        />
      </div>
    </div>
  );
}

function ScheduleSlideRenderer({ slide, ...canvas }: { slide: ScheduleSlide } & CanvasProps) {
  const { onCanvasEdit, canvasFieldLink, linkedFieldId } = canvas;
  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-[#5b5c64]/10 bg-[#FFFFFF] p-8 shadow-sm">
      <div className="mb-6 flex items-end justify-between">
        <CanvasEditableText
          as="h3"
          fieldId={CF.scheduleTitle}
          value={slide.scheduleTitle || ''}
          commit={(next) => onCanvasEdit?.((s) => { if (s.type === 'schedule') s.scheduleTitle = next; })}
          onCanvasEdit={onCanvasEdit}
          canvasFieldLink={canvasFieldLink}
          linkedFieldId={linkedFieldId}
          className="text-2xl font-black text-[#1C1C1E]"
        />
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b-2 border-[#1C1C1E]/20 text-left">
            <th className="w-[15%] px-4 py-3 text-sm font-bold text-[#5b5c64]">時間</th>
            <th className="w-[12%] px-4 py-3 text-sm font-bold text-[#5b5c64]">撮影対象</th>
            <th className="w-[48%] px-4 py-3 text-sm font-bold text-[#5b5c64]">内容</th>
            <th className="w-[25%] px-4 py-3 text-sm font-bold text-[#5b5c64]">備考</th>
          </tr>
        </thead>
        <tbody>
          {slide.rows.map((row) => {
            const rowImg = safeImageSrc(row.image);
            return (
              <tr key={row.id} className="border-b border-[#5b5c64]/20">
                <td className="align-top px-4 py-4">
                  <CanvasEditableText
                    as="div"
                    fieldId={CF.scheduleRow(row.id, 'time')}
                    value={row.time}
                    commit={(next) =>
                      onCanvasEdit?.((s) => {
                        if (s.type !== 'schedule') return;
                        const r = s.rows.find((x) => x.id === row.id);
                        if (r) r.time = next;
                      })
                    }
                    onCanvasEdit={onCanvasEdit}
                    canvasFieldLink={canvasFieldLink}
                    linkedFieldId={linkedFieldId}
                    className="text-lg font-bold text-[#1C1C1E]"
                  />
                </td>
                <td className="align-top px-4 py-4">
                  <CanvasEditableText
                    as="div"
                    fieldId={CF.scheduleRow(row.id, 'shootingSubject')}
                    value={row.shootingSubject ?? ''}
                    commit={(next) =>
                      onCanvasEdit?.((s) => {
                        if (s.type !== 'schedule') return;
                        const r = s.rows.find((x) => x.id === row.id);
                        if (r) r.shootingSubject = next;
                      })
                    }
                    onCanvasEdit={onCanvasEdit}
                    canvasFieldLink={canvasFieldLink}
                    linkedFieldId={linkedFieldId}
                    className="text-lg font-medium text-[#1C1C1E]"
                  />
                </td>
                <td className="align-top px-4 py-4">
                  <div className="flex gap-6">
                    <div className="relative h-32 w-56 flex-shrink-0 overflow-hidden rounded-lg border border-[#5b5c64]/12 bg-[#FFFFFF] shadow-sm">
                      {rowImg ? (
                        <img src={rowImg} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-sm font-medium text-[#5b5c64]">画像なし</div>
                      )}
                    </div>
                    <div className="flex flex-col justify-start pt-2">
                      <CanvasEditableText
                        as="div"
                        fieldId={CF.scheduleRow(row.id, 'sceneName')}
                        value={row.sceneName}
                        commit={(next) =>
                          onCanvasEdit?.((s) => {
                            if (s.type !== 'schedule') return;
                            const r = s.rows.find((x) => x.id === row.id);
                            if (r) r.sceneName = next;
                          })
                        }
                        onCanvasEdit={onCanvasEdit}
                        canvasFieldLink={canvasFieldLink}
                        linkedFieldId={linkedFieldId}
                        multiline
                        className="mb-2 text-xl font-bold whitespace-pre-wrap text-[#1C1C1E]"
                      />
                      <CanvasEditableText
                        as="div"
                        fieldId={CF.scheduleRow(row.id, 'staffDetails')}
                        value={row.staffDetails || ''}
                        commit={(next) =>
                          onCanvasEdit?.((s) => {
                            if (s.type !== 'schedule') return;
                            const r = s.rows.find((x) => x.id === row.id);
                            if (r) r.staffDetails = next;
                          })
                        }
                        onCanvasEdit={onCanvasEdit}
                        canvasFieldLink={canvasFieldLink}
                        linkedFieldId={linkedFieldId}
                        multiline
                        className="text-sm leading-relaxed whitespace-pre-wrap text-[#5b5c64]"
                      />
                    </div>
                  </div>
                </td>
                <td className="align-top px-4 py-4">
                  <CanvasEditableText
                    as="div"
                    fieldId={CF.scheduleRow(row.id, 'cameraNotes')}
                    value={row.cameraNotes}
                    commit={(next) =>
                      onCanvasEdit?.((s) => {
                        if (s.type !== 'schedule') return;
                        const r = s.rows.find((x) => x.id === row.id);
                        if (r) r.cameraNotes = next;
                      })
                    }
                    onCanvasEdit={onCanvasEdit}
                    canvasFieldLink={canvasFieldLink}
                    linkedFieldId={linkedFieldId}
                    multiline
                    className="text-sm leading-relaxed whitespace-pre-wrap text-[#5b5c64]"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ListSlideRenderer({ slide, ...canvas }: { slide: ListSlide } & CanvasProps) {
  const { onCanvasEdit, canvasFieldLink, linkedFieldId } = canvas;
  return (
    <div className="flex h-full w-full flex-col items-center overflow-hidden rounded-xl border border-[#5b5c64]/10 bg-[#FFFFFF] p-8 shadow-sm">
      <CanvasEditableText
        as="h2"
        fieldId={CF.listTitle}
        value={slide.title || ''}
        commit={(next) => onCanvasEdit?.((s) => { if (s.type === 'list') s.title = next; })}
        onCanvasEdit={onCanvasEdit}
        canvasFieldLink={canvasFieldLink}
        linkedFieldId={linkedFieldId}
        className="mb-8 text-center text-3xl font-black text-[#1C1C1E]"
      />

      <div className="w-full max-w-5xl space-y-3 overflow-auto">
        {slide.items.map((item, i) => (
          <div key={item.id} className="flex items-start gap-4 rounded-lg border border-[#5b5c64]/10 bg-[#FFFFFF] p-4 shadow-sm">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#5b5c64]/10 text-sm font-bold text-[#1C1C1E]">
              {i + 1}
            </div>
            <div className="min-w-0 flex-1">
              <CanvasEditableText
                as="h3"
                fieldId={CF.listItem(item.id, 'title')}
                value={item.title}
                commit={(next) =>
                  onCanvasEdit?.((s) => {
                    if (s.type !== 'list') return;
                    const it = s.items.find((x) => x.id === item.id);
                    if (it) it.title = next;
                  })
                }
                onCanvasEdit={onCanvasEdit}
                canvasFieldLink={canvasFieldLink}
                linkedFieldId={linkedFieldId}
                className="mb-1 text-lg font-bold text-[#1C1C1E]"
              />
              <CanvasEditableText
                as="p"
                fieldId={CF.listItem(item.id, 'description')}
                value={item.description}
                commit={(next) =>
                  onCanvasEdit?.((s) => {
                    if (s.type !== 'list') return;
                    const it = s.items.find((x) => x.id === item.id);
                    if (it) it.description = next;
                  })
                }
                onCanvasEdit={onCanvasEdit}
                canvasFieldLink={canvasFieldLink}
                linkedFieldId={linkedFieldId}
                multiline
                className="mb-2 text-sm leading-relaxed text-[#5b5c64]"
              />
              {item.url && safeExternalHref(item.url) && (
                <a
                  href={safeExternalHref(item.url)!}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-xs font-medium text-blue-600 hover:underline"
                >
                  {item.url}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CustomPortraitImageFrame({ src }: { src: string | null }) {
  return (
    <div className="flex min-h-0 min-w-0 items-center justify-center py-1">
      <div
        className="relative mx-auto max-h-full w-full max-w-[min(100%,200px)] overflow-hidden rounded-none border-[4px] border-[#2a2a2a] bg-[#0d0d0d] shadow-[0_8px_28px_rgba(0,0,0,0.18)]"
        style={{
          height: 'min(100%, 520px)',
          aspectRatio: '9 / 20',
        }}
      >
        {src ? (
          <img src={src} alt="" className="h-full w-full object-contain object-center" />
        ) : (
          <div className="flex h-full min-h-[100px] w-full items-center justify-center px-2 text-center text-xs leading-snug text-[#5b5c64]">
            右のパネルで画像 URL を設定
          </div>
        )}
      </div>
    </div>
  );
}

function CustomSlideRenderer({ slide, ...canvas }: { slide: CustomSlide } & CanvasProps) {
  const { onCanvasEdit, canvasFieldLink, linkedFieldId } = canvas;
  const layout = slide.layout || 'text-left';
  const imageSrc = safeImageSrc(slide.image);
  const imageSrc2 = safeImageSrc(slide.image2 ?? '');
  const isPortraitSide = layout === 'portrait-left' || layout === 'portrait-right';
  const showTitle = Boolean(slide.title) || Boolean(onCanvasEdit);

  if (layout === 'portrait-3col') {
    return (
      <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-[#5b5c64]/10 bg-[#FFFFFF] p-12 shadow-sm">
        {showTitle && (
          <CanvasEditableText
            as="h2"
            fieldId={CF.customTitle}
            value={slide.title || ''}
            commit={(next) => onCanvasEdit?.((s) => { if (s.type === 'custom') s.title = next; })}
            onCanvasEdit={onCanvasEdit}
            canvasFieldLink={canvasFieldLink}
            linkedFieldId={linkedFieldId}
            className="mb-5 shrink-0 text-4xl font-black tracking-tight text-[#1C1C1E]"
          />
        )}
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.12fr)_minmax(0,0.94fr)_minmax(0,0.94fr)] gap-5 text-lg leading-relaxed text-[#1C1C1E]">
          <div className="flex min-h-0 min-w-0 flex-col">
            <CanvasEditableText
              as="div"
              fieldId={CF.customContent}
              value={slide.content || ''}
              commit={(next) => onCanvasEdit?.((s) => { if (s.type === 'custom') s.content = next; })}
              onCanvasEdit={onCanvasEdit}
              canvasFieldLink={canvasFieldLink}
              linkedFieldId={linkedFieldId}
              multiline
              className="min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap"
            />
          </div>
          <CustomPortraitImageFrame src={imageSrc} />
          <CustomPortraitImageFrame src={imageSrc2} />
        </div>
      </div>
    );
  }

  if (isPortraitSide) {
    const rowDir = layout === 'portrait-right' ? 'flex-row-reverse' : 'flex-row';
    const phoneFrame = (
      <div className="flex shrink-0 items-center justify-center self-stretch px-1 sm:px-2">
        <div
          className="relative overflow-hidden rounded-none border-[5px] border-[#2a2a2a] bg-[#0d0d0d] shadow-[0_12px_40px_rgba(0,0,0,0.22)]"
          style={{
            height: 'min(100%, 580px)',
            aspectRatio: '9 / 22',
          }}
        >
          {imageSrc ? (
            <img src={imageSrc} alt="" className="h-full w-full object-contain object-center" />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-3 text-center text-sm leading-snug text-[#5b5c64]">
              右のパネルで画像 URL を設定
            </div>
          )}
        </div>
      </div>
    );

    return (
      <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-[#5b5c64]/10 bg-[#FFFFFF] p-12 shadow-sm">
        {showTitle && (
          <CanvasEditableText
            as="h2"
            fieldId={CF.customTitle}
            value={slide.title || ''}
            commit={(next) => onCanvasEdit?.((s) => { if (s.type === 'custom') s.title = next; })}
            onCanvasEdit={onCanvasEdit}
            canvasFieldLink={canvasFieldLink}
            linkedFieldId={linkedFieldId}
            className="mb-5 shrink-0 text-4xl font-black tracking-tight text-[#1C1C1E]"
          />
        )}
        <div className={`flex min-h-0 flex-1 gap-8 text-lg leading-relaxed text-[#1C1C1E] sm:gap-10 ${rowDir}`}>
          {phoneFrame}
          <CanvasEditableText
            as="div"
            fieldId={CF.customContent}
            value={slide.content || ''}
            commit={(next) => onCanvasEdit?.((s) => { if (s.type === 'custom') s.content = next; })}
            onCanvasEdit={onCanvasEdit}
            canvasFieldLink={canvasFieldLink}
            linkedFieldId={linkedFieldId}
            multiline
            className="min-h-0 min-w-0 flex-1 overflow-y-auto"
          />
        </div>
      </div>
    );
  }

  const flexDirection =
    layout === 'text-right' ? 'flex-row-reverse' :
    layout === 'top-bottom' ? 'flex-col-reverse' :
    'flex-row';

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-xl border border-[#5b5c64]/10 bg-[#FFFFFF] p-12 shadow-sm">
      {showTitle && (
        <CanvasEditableText
          as="h2"
          fieldId={CF.customTitle}
          value={slide.title || ''}
          commit={(next) => onCanvasEdit?.((s) => { if (s.type === 'custom') s.title = next; })}
          onCanvasEdit={onCanvasEdit}
          canvasFieldLink={canvasFieldLink}
          linkedFieldId={linkedFieldId}
          className="mb-8 shrink-0 text-4xl font-black text-[#1C1C1E]"
        />
      )}

      <div className={`relative flex flex-1 gap-12 text-lg leading-relaxed text-[#1C1C1E] ${flexDirection}`}>
        {layout !== 'image-only' && (
          <CanvasEditableText
            as="div"
            fieldId={CF.customContent}
            value={slide.content || ''}
            commit={(next) => onCanvasEdit?.((s) => { if (s.type === 'custom') s.content = next; })}
            onCanvasEdit={onCanvasEdit}
            canvasFieldLink={canvasFieldLink}
            linkedFieldId={linkedFieldId}
            multiline
            className="flex-1 overflow-y-auto whitespace-pre-wrap"
            style={{ flex: slide.image && layout !== 'text-only' ? '1' : '100%' }}
          />
        )}

        {slide.image && layout !== 'text-only' && imageSrc && (
          <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-[#5b5c64]/10 bg-[#5b5c64]/5 shadow-sm">
            <img src={imageSrc} alt="" className="h-full w-full object-cover" />
          </div>
        )}
      </div>
    </div>
  );
}
