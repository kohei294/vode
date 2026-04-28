/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import type {
  ConceptSlide,
  CustomSlide,
  GridSlide,
  ListSlide,
  ScheduleSlide,
  Slide,
  SplitSlide,
} from '../../types';
import { CF } from '../../lib/canvasEditorFieldIds';
import { EditorField, type EditorFieldLinkHandlers } from './EditorField';
import { ImageSourceField, normalizeImageFieldValue } from '../ImageSourceField';

export type MutateSlide = (updater: (draft: Slide) => void) => void;

export type SlideEditorPanelProps = {
  linkedCanvasFieldId: string | null;
  fieldLink: EditorFieldLinkHandlers;
  /** 画像ファイルの読み込み失敗など（親のトースト用） */
  reportError?: (message: string) => void;
};

function patchConcept(update: MutateSlide, fn: (d: ConceptSlide) => void) {
  update((s) => {
    if (s.type === 'concept') fn(s);
  });
}

function patchGrid(update: MutateSlide, fn: (d: GridSlide) => void) {
  update((s) => {
    if (s.type === 'grid') fn(s);
  });
}

function patchSplit(update: MutateSlide, fn: (d: SplitSlide) => void) {
  update((s) => {
    if (s.type === 'split') fn(s);
  });
}

function patchSchedule(update: MutateSlide, fn: (d: ScheduleSlide) => void) {
  update((s) => {
    if (s.type === 'schedule') fn(s);
  });
}

function patchList(update: MutateSlide, fn: (d: ListSlide) => void) {
  update((s) => {
    if (s.type === 'list') fn(s);
  });
}

function patchCustom(update: MutateSlide, fn: (d: CustomSlide) => void) {
  update((s) => {
    if (s.type === 'custom') fn(s);
  });
}

function normalizeCommaSeparatedTags(raw: string): string {
  return raw
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .join(', ');
}

export function ConceptEditor({
  slide,
  update,
  linkedCanvasFieldId,
  fieldLink,
}: {
  slide: ConceptSlide;
  update: MutateSlide;
} & SlideEditorPanelProps) {
  return (
    <>
      <EditorField fieldId={CF.mainHeadline} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#5b5c64]">メイン見出し</label>
          <textarea
            value={slide.mainHeadline}
            onChange={(e) => patchConcept(update, (d) => { d.mainHeadline = e.target.value; })}
            className="h-24 w-full rounded border border-[#5b5c64]/30 px-3 py-2 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
          />
        </div>
      </EditorField>
      <EditorField fieldId={CF.subHeadline} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#5b5c64]">サブ見出し</label>
          <input
            type="text"
            value={slide.subHeadline}
            onChange={(e) => patchConcept(update, (d) => { d.subHeadline = e.target.value; })}
            className="w-full rounded border border-[#5b5c64]/30 px-3 py-2 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
          />
        </div>
      </EditorField>
      <EditorField fieldId={CF.pills} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#5b5c64] flex justify-between">ピル（カンマ区切り）</label>
          <input
            type="text"
            value={slide.pills.join(',')}
            onChange={(e) =>
              patchConcept(update, (d) => {
                d.pills = e.target.value.split(',').filter(Boolean);
              })
            }
            className="w-full rounded border border-[#5b5c64]/30 px-3 py-2 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
          />
        </div>
      </EditorField>
      <EditorField fieldId={CF.tags} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#5b5c64] flex justify-between">タグ（カンマ区切り）</label>
          <input
            type="text"
            value={(slide.tags || []).join(',')}
            onChange={(e) =>
              patchConcept(update, (d) => {
                d.tags = e.target.value.split(',').filter(Boolean);
              })
            }
            className="w-full rounded border border-[#5b5c64]/30 px-3 py-2 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
          />
        </div>
      </EditorField>
    </>
  );
}

export function GridEditor({
  slide,
  update,
  linkedCanvasFieldId,
  fieldLink,
}: { slide: GridSlide; update: MutateSlide } & SlideEditorPanelProps) {
  return (
    <div className="space-y-4">
      {slide.columns.map((col, i) => (
        <div key={i} className="relative space-y-2 rounded border border-[#5b5c64]/15 bg-[#5b5c64]/5 p-3">
          <div className="text-xs font-bold text-[#1C1C1E]">列 {i + 1}</div>
          <EditorField fieldId={CF.grid(i, 'title')} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
            <input
              type="text"
              placeholder="タイトル"
              value={col.title}
              onChange={(e) => patchGrid(update, (d) => { d.columns[i].title = e.target.value; })}
              className="w-full rounded border border-[#5b5c64]/30 bg-[#FFFFFF] px-2 py-1 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
            />
          </EditorField>
          <EditorField fieldId={CF.grid(i, 'details')} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
            <textarea
              placeholder="本文・詳細"
              value={col.details}
              onChange={(e) => patchGrid(update, (d) => { d.columns[i].details = e.target.value; })}
              className="h-16 w-full rounded border border-[#5b5c64]/30 bg-[#FFFFFF] px-2 py-1 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
            />
          </EditorField>
          <EditorField fieldId={CF.grid(i, 'descriptionTitle')} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
            <input
              type="text"
              placeholder="説明ブロックの見出し"
              value={col.descriptionTitle}
              onChange={(e) => patchGrid(update, (d) => { d.columns[i].descriptionTitle = e.target.value; })}
              className="w-full rounded border border-[#5b5c64]/30 bg-[#FFFFFF] px-2 py-1 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
            />
          </EditorField>
          <EditorField fieldId={CF.grid(i, 'descriptionText')} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
            <textarea
              placeholder="説明ブロックの本文"
              value={col.descriptionText}
              onChange={(e) => patchGrid(update, (d) => { d.columns[i].descriptionText = e.target.value; })}
              className="h-20 w-full rounded border border-[#5b5c64]/30 bg-[#FFFFFF] px-2 py-1 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
            />
          </EditorField>
        </div>
      ))}
    </div>
  );
}

export function SplitEditor({
  slide,
  update,
  linkedCanvasFieldId,
  fieldLink,
  reportError,
}: { slide: SplitSlide; update: MutateSlide } & SlideEditorPanelProps) {
  return (
    <>
      <EditorField fieldId={CF.splitBadge} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#5b5c64]">バッジ（左上ラベル）</label>
          <input
            type="text"
            value={slide.badge}
            onChange={(e) => patchSplit(update, (d) => { d.badge = e.target.value; })}
            className="w-full rounded border border-[#5b5c64]/30 px-3 py-2 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
          />
        </div>
      </EditorField>
      <ImageSourceField
        label="画像（URL またはファイル）"
        value={slide.leftImage}
        onChange={(next) => patchSplit(update, (d) => { d.leftImage = next; })}
        onBlurCommit={(raw) =>
          patchSplit(update, (d) => {
            d.leftImage = normalizeImageFieldValue(raw);
          })
        }
        reportError={reportError}
      />
      <EditorField fieldId={CF.splitLeftSubtext} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#5b5c64]">画像下のキャプション</label>
          <input
            type="text"
            value={slide.leftSubtext || ''}
            onChange={(e) => patchSplit(update, (d) => { d.leftSubtext = e.target.value; })}
            className="w-full rounded border border-[#5b5c64]/30 px-3 py-2 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
          />
        </div>
      </EditorField>
      <EditorField fieldId={CF.splitRightHeading} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#5b5c64]">右カラムの見出し</label>
          <input
            type="text"
            value={slide.rightHeading}
            onChange={(e) => patchSplit(update, (d) => { d.rightHeading = e.target.value; })}
            className="w-full rounded border border-[#5b5c64]/30 px-3 py-2 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
          />
        </div>
      </EditorField>
      <EditorField fieldId={CF.splitRightSubheading} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#5b5c64]">右カラムのサブ見出し</label>
          <input
            type="text"
            value={slide.rightSubheading}
            onChange={(e) => patchSplit(update, (d) => { d.rightSubheading = e.target.value; })}
            className="w-full rounded border border-[#5b5c64]/30 px-3 py-2 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
          />
        </div>
      </EditorField>
      <EditorField fieldId={CF.splitRightDescription} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#5b5c64]">右カラムの本文</label>
          <textarea
            value={slide.rightDescription}
            onChange={(e) => patchSplit(update, (d) => { d.rightDescription = e.target.value; })}
            className="h-32 w-full rounded border border-[#5b5c64]/30 px-3 py-2 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
          />
        </div>
      </EditorField>
      <EditorField fieldId={CF.splitRightList} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#5b5c64]">画像下の箇条書き（1行1項目）</label>
          <textarea
            value={(slide.rightList || []).join('\n')}
            onChange={(e) => {
              patchSplit(update, (d) => {
                d.rightList = e.target.value.split('\n').map((l) => l.trim()).filter(Boolean);
              });
            }}
            placeholder="1行に1項目（例：ポイント1）"
            className="h-28 w-full whitespace-pre-wrap rounded border border-[#5b5c64]/30 px-3 py-2 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
          />
        </div>
      </EditorField>
    </>
  );
}

export function ScheduleEditor({
  slide,
  update,
  linkedCanvasFieldId,
  fieldLink,
  reportError,
}: { slide: ScheduleSlide; update: MutateSlide } & SlideEditorPanelProps) {
  return (
    <div className="space-y-4">
      <EditorField fieldId={CF.scheduleTitle} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#5b5c64]">表のタイトル（任意）</label>
          <input
            type="text"
            value={slide.scheduleTitle || ''}
            onChange={(e) => patchSchedule(update, (d) => { d.scheduleTitle = e.target.value; })}
            className="w-full rounded border border-[#5b5c64]/30 px-3 py-2 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
          />
        </div>
      </EditorField>

      <div className="mt-4 border-b border-[#5b5c64]/20 pb-2 text-sm font-bold text-[#1C1C1E]">行</div>
      {slide.rows.map((row, i) => (
        <div key={row.id} className="relative space-y-2 rounded border border-[#5b5c64]/15 bg-[#5b5c64]/5 p-3">
          <EditorField fieldId={CF.scheduleRow(row.id, 'time')} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
            <input
              type="text"
              placeholder="時間（例：10:00–11:00）"
              value={row.time}
              onChange={(e) => patchSchedule(update, (d) => { d.rows[i].time = e.target.value; })}
              className="w-full rounded border border-[#5b5c64]/30 bg-[#FFFFFF] px-2 py-1 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
            />
          </EditorField>
          <EditorField fieldId={CF.scheduleRow(row.id, 'shootingSubject')} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
            <input
              type="text"
              placeholder="例：風景、モデル、商品"
              value={row.shootingSubject || ''}
              onChange={(e) => patchSchedule(update, (d) => { d.rows[i].shootingSubject = e.target.value; })}
              className="w-full rounded border border-[#5b5c64]/30 bg-[#FFFFFF] px-2 py-1 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
            />
          </EditorField>
          <EditorField fieldId={CF.scheduleRow(row.id, 'sceneName')} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
            <textarea
              placeholder="シーン名・内容"
              value={row.sceneName}
              onChange={(e) => patchSchedule(update, (d) => { d.rows[i].sceneName = e.target.value; })}
              className="h-12 w-full rounded border border-[#5b5c64]/30 bg-[#FFFFFF] px-2 py-1 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
            />
          </EditorField>
          <EditorField fieldId={CF.scheduleRow(row.id, 'staffDetails')} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
            <textarea
              placeholder="スタッフ・演出メモ（スライドの「備考」左に表示）"
              value={row.staffDetails || ''}
              onChange={(e) => patchSchedule(update, (d) => { d.rows[i].staffDetails = e.target.value; })}
              className="h-16 w-full rounded border border-[#5b5c64]/30 bg-[#FFFFFF] px-2 py-1 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
            />
          </EditorField>
          <div className="rounded border border-[#5b5c64]/10 bg-[#FFFFFF] p-2">
            <ImageSourceField
              label="画像（URL またはファイル）"
              value={row.image}
              onChange={(next) => patchSchedule(update, (d) => { d.rows[i].image = next; })}
              onBlurCommit={(raw) =>
                patchSchedule(update, (d) => {
                  d.rows[i].image = normalizeImageFieldValue(raw);
                })
              }
              hint="スライド左列の写真として表示されます。"
              reportError={reportError}
            />
          </div>
          <EditorField fieldId={CF.scheduleRow(row.id, 'cameraNotes')} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
            <textarea
              placeholder="カメラ・撮影メモ（スライド右列）"
              value={row.cameraNotes}
              onChange={(e) => patchSchedule(update, (d) => { d.rows[i].cameraNotes = e.target.value; })}
              className="h-20 w-full rounded border border-[#5b5c64]/30 bg-[#FFFFFF] px-2 py-1 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
            />
          </EditorField>
          <button
            type="button"
            onClick={() =>
              patchSchedule(update, (d) => {
                d.rows = d.rows.filter((_, index) => index !== i);
              })
            }
            className="mt-2 text-xs font-medium text-[#1C1C1E] hover:underline"
          >
            この行を削除
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          patchSchedule(update, (d) => {
            d.rows.push({
              id: crypto.randomUUID(),
              time: '',
              sceneName: '',
              image: '',
              staffDetails: '',
              cameraNotes: '',
            });
          })
        }
        className="w-full rounded border border-dashed border-[#5b5c64]/30 py-2 text-sm text-[#5b5c64] hover:bg-[#5b5c64]/10"
      >
        ＋ 行を追加
      </button>
    </div>
  );
}

export function ListEditor({
  slide,
  update,
  linkedCanvasFieldId,
  fieldLink,
}: { slide: ListSlide; update: MutateSlide } & SlideEditorPanelProps) {
  return (
    <div className="space-y-4">
      <EditorField fieldId={CF.listTitle} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#5b5c64]">リストのタイトル</label>
          <input
            type="text"
            value={slide.title || ''}
            onChange={(e) => patchList(update, (d) => { d.title = e.target.value; })}
            className="w-full rounded border border-[#5b5c64]/30 px-3 py-2 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
          />
        </div>
      </EditorField>

      <div className="mt-4 border-b border-[#5b5c64]/20 pb-2 text-sm font-bold text-[#1C1C1E]">項目</div>
      {slide.items.map((item, i) => (
        <div key={item.id} className="relative space-y-2 rounded border border-[#5b5c64]/15 bg-[#5b5c64]/5 p-3">
          <EditorField fieldId={CF.listItem(item.id, 'title')} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
            <input
              type="text"
              placeholder="見出し"
              value={item.title}
              onChange={(e) => patchList(update, (d) => { d.items[i].title = e.target.value; })}
              className="w-full rounded border border-[#5b5c64]/30 bg-[#FFFFFF] px-2 py-1 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
            />
          </EditorField>
          <EditorField fieldId={CF.listItem(item.id, 'tag')} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
            <input
              type="text"
              placeholder="タグ（任意・カンマ区切り）"
              value={item.tag || ''}
              onChange={(e) =>
                patchList(update, (d) => {
                  d.items[i].tag = e.target.value;
                })
              }
              onBlur={(e) =>
                patchList(update, (d) => {
                  d.items[i].tag = normalizeCommaSeparatedTags(e.target.value);
                })
              }
              className="w-full rounded border border-[#5b5c64]/30 bg-[#FFFFFF] px-2 py-1 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
            />
          </EditorField>
          <EditorField fieldId={CF.listItem(item.id, 'description')} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
            <textarea
              placeholder="説明"
              value={item.description}
              onChange={(e) => patchList(update, (d) => { d.items[i].description = e.target.value; })}
              className="h-20 w-full whitespace-pre-wrap rounded border border-[#5b5c64]/30 bg-[#FFFFFF] px-2 py-1 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
            />
          </EditorField>
          <input
            type="text"
            placeholder="リンク URL（任意）"
            value={item.url || ''}
            onChange={(e) => patchList(update, (d) => { d.items[i].url = e.target.value; })}
            className="w-full rounded border border-[#5b5c64]/30 bg-[#FFFFFF] px-2 py-1 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
          />
          <button
            type="button"
            onClick={() =>
              patchList(update, (d) => {
                d.items = d.items.filter((_, index) => index !== i);
              })
            }
            className="mt-2 text-xs font-medium text-[#1C1C1E] hover:underline"
          >
            この項目を削除
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() =>
          patchList(update, (d) => {
            d.items.push({
              id: crypto.randomUUID(),
              title: '',
              tag: '',
              description: '',
              url: '',
            });
          })
        }
        className="w-full rounded border border-dashed border-[#5b5c64]/30 py-2 text-sm text-[#5b5c64] hover:bg-[#5b5c64]/10"
      >
        ＋ 項目を追加
      </button>
    </div>
  );
}

const CUSTOM_LAYOUT_VALUES: CustomSlide['layout'][] = [
  'text-left',
  'text-right',
  'text-only',
  'image-only',
  'top-bottom',
  'portrait-left',
  'portrait-right',
  'portrait-3col',
];

function parseLayout(value: string): CustomSlide['layout'] | undefined {
  return CUSTOM_LAYOUT_VALUES.includes(value as CustomSlide['layout'])
    ? (value as CustomSlide['layout'])
    : undefined;
}

export function CustomEditor({
  slide,
  update,
  linkedCanvasFieldId,
  fieldLink,
  reportError,
}: { slide: CustomSlide; update: MutateSlide } & SlideEditorPanelProps) {
  return (
    <div className="space-y-4">
      <EditorField fieldId={CF.customTitle} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#5b5c64]">タイトル</label>
          <input
            type="text"
            value={slide.title || ''}
            onChange={(e) => patchCustom(update, (d) => { d.title = e.target.value; })}
            className="w-full rounded border border-[#5b5c64]/30 px-3 py-2 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
          />
        </div>
      </EditorField>
      <div className="space-y-1">
        <label className="text-xs font-medium text-[#5b5c64]">レイアウト</label>
        <select
          value={slide.layout || 'text-left'}
          onChange={(e) => {
            const next = parseLayout(e.target.value);
            if (next) patchCustom(update, (d) => { d.layout = next; });
          }}
          className="w-full rounded border border-[#5b5c64]/30 bg-[#FFFFFF] px-3 py-2 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
        >
          <option value="text-left">テキスト左・画像右</option>
          <option value="text-right">テキスト右・画像左</option>
          <option value="portrait-left">縦画像・左／テキスト右</option>
          <option value="portrait-right">縦画像・右／テキスト左</option>
          <option value="portrait-3col">縦画像×2（3カラム）</option>
          <option value="text-only">テキストのみ</option>
          <option value="image-only">画像のみ</option>
          <option value="top-bottom">画像上・テキスト下</option>
        </select>
      </div>
      <EditorField fieldId={CF.customContent} linkedFieldId={linkedCanvasFieldId} fieldLink={fieldLink}>
        <div className="space-y-1">
          <label className="text-xs font-medium text-[#5b5c64]">本文</label>
          <textarea
            value={slide.content || ''}
            onChange={(e) => patchCustom(update, (d) => { d.content = e.target.value; })}
            className="h-64 w-full whitespace-pre-wrap rounded border border-[#5b5c64]/30 px-3 py-2 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
          />
        </div>
      </EditorField>
      <ImageSourceField
        label={
          slide.layout === 'portrait-3col'
            ? '画像（中列の縦画像・URL またはファイル）'
            : '画像（任意・URL またはファイル）'
        }
        value={slide.image || ''}
        onChange={(next) => patchCustom(update, (d) => { d.image = next; })}
        onBlurCommit={(raw) =>
          patchCustom(update, (d) => {
            d.image = normalizeImageFieldValue(raw);
          })
        }
        reportError={reportError}
      />
      {slide.layout === 'portrait-3col' && (
        <ImageSourceField
          label="画像（右列の縦画像・URL またはファイル）"
          value={slide.image2 || ''}
          onChange={(next) => patchCustom(update, (d) => { d.image2 = next; })}
          onBlurCommit={(raw) =>
            patchCustom(update, (d) => {
              d.image2 = normalizeImageFieldValue(raw);
            })
          }
          reportError={reportError}
        />
      )}
    </div>
  );
}
