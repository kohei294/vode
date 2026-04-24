/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { Project, Slide } from '../types';
import { SLIDE_TYPE_LABELS } from '../lib/slideLabels';
import { cn } from '../lib/utils';

type Props = {
  open: boolean;
  onClose: () => void;
  /** コピー元（現在のプロジェクト）のスライド一覧 */
  slides: Slide[];
  otherProjects: Project[];
  maxSlidesPerProject: number;
  onConfirm: (targetProjectId: string, orderedSlideIds: string[]) => void;
};

export function CopySlidesToProjectModal({
  open,
  onClose,
  slides,
  otherProjects,
  maxSlidesPerProject,
  onConfirm,
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [targetId, setTargetId] = useState('');

  const slideIdsKey = slides.map((s) => s.id).join(',');
  const otherProjectIdsKey = otherProjects.map((p) => p.id).join(',');

  useEffect(() => {
    if (!open) return;
    setSelectedIds(new Set(slides.map((s) => s.id)));
    setTargetId(otherProjects[0]?.id ?? '');
    // slides / otherProjects は slideIdsKey・otherProjectIdsKey で表現し、親の毎レンダーで選択が消えないようにする
    // eslint-disable-next-line react-hooks/exhaustive-deps -- 上記キーで十分
  }, [open, slideIdsKey, otherProjectIdsKey]);

  const targetProject = useMemo(
    () => otherProjects.find((p) => p.id === targetId) ?? null,
    [otherProjects, targetId]
  );

  const selectedCount = selectedIds.size;
  const roomLeft = targetProject ? maxSlidesPerProject - targetProject.slides.length : 0;
  const overLimit = targetProject && selectedCount > roomLeft;

  if (!open) return null;

  const toggleId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(slides.map((s) => s.id)));
  };

  const clearAll = () => {
    setSelectedIds(new Set());
  };

  const orderedSelectedIds = slides.filter((s) => selectedIds.has(s.id)).map((s) => s.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetId || selectedCount === 0 || overLimit) return;
    onConfirm(targetId, orderedSelectedIds);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0d0d0f]/50 p-4 print:hidden"
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="copy-slides-modal-title"
        className="flex max-h-[min(90vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[#5b5c64]/20 bg-[#FFFFFF] shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#5b5c64]/15 px-5 py-4">
          <div className="min-w-0">
            <h2 id="copy-slides-modal-title" className="text-lg font-bold text-[#1C1C1E]">
              スライドを別プロジェクトへコピー
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-[#5b5c64]">
              コピー先プロジェクトの<strong className="font-semibold text-[#1C1C1E]">末尾</strong>
              に追加します。スライドの id は新しく振り直されます（元プロジェクトは変わりません）。
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-[#5b5c64] hover:bg-[#5b5c64]/10 hover:text-[#1C1C1E]"
            aria-label="閉じる"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {otherProjects.length === 0 ? (
              <p className="text-sm text-[#5b5c64]">
                コピー先にできる<strong className="text-[#1C1C1E]">別のプロジェクト</strong>がありません。ダッシュボードでプロジェクトを追加してください。
              </p>
            ) : (
              <>
                <div className="space-y-2">
                  <label htmlFor="copy-slides-target" className="text-xs font-semibold text-[#5b5c64]">
                    コピー先プロジェクト
                  </label>
                  <select
                    id="copy-slides-target"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full rounded-md border border-[#5b5c64]/30 bg-[#FFFFFF] px-3 py-2 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none focus:ring-1 focus:ring-[#1C1C1E]/20"
                  >
                    {otherProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}（{p.slides.length} 枚）
                      </option>
                    ))}
                  </select>
                  {targetProject ? (
                    <p className="text-[11px] leading-snug text-[#5b5c64]">
                      追加後の枚数: {targetProject.slides.length} → {targetProject.slides.length + selectedCount}{' '}
                      枚（上限 {maxSlidesPerProject} 枚）
                      {overLimit ? (
                        <span className="mt-1 block font-medium text-red-800">
                          上限を超えるため、このままではコピーできません。コピー先でスライドを減らすか、こちらで選択枚数を減らしてください。
                        </span>
                      ) : null}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#5b5c64]">
                      コピーするスライド（{selectedCount} / {slides.length} 枚選択）
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={selectAll}
                        className="text-[11px] font-medium text-[#1C1C1E] underline decoration-[#5b5c64]/40 underline-offset-2 hover:decoration-[#1C1C1E]"
                      >
                        すべて選択
                      </button>
                      <button
                        type="button"
                        onClick={clearAll}
                        className="text-[11px] font-medium text-[#1C1C1E] underline decoration-[#5b5c64]/40 underline-offset-2 hover:decoration-[#1C1C1E]"
                      >
                        すべて解除
                      </button>
                    </div>
                  </div>
                  <ul className="max-h-52 space-y-1 overflow-y-auto rounded-lg border border-[#5b5c64]/15 p-2">
                    {slides.map((slide, i) => {
                      const checked = selectedIds.has(slide.id);
                      return (
                        <li key={slide.id}>
                          <label
                            className={cn(
                              'flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                              checked ? 'bg-[#5b5c64]/8' : 'hover:bg-[#5b5c64]/5'
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleId(slide.id)}
                              className="mt-0.5 shrink-0 rounded border-[#5b5c64]/40 text-[#1C1C1E] focus:ring-[#1C1C1E]"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="tabular-nums text-[#5b5c64]">{i + 1}. </span>
                              <span className="font-medium text-[#1C1C1E]">{slide.headerTitle || slide.type}</span>
                              <span className="ml-1.5 text-xs text-[#5b5c64]">({SLIDE_TYPE_LABELS[slide.type]})</span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </>
            )}
          </div>

          <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-[#5b5c64]/15 px-5 py-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#5b5c64]/25 px-4 py-2 text-sm font-medium text-[#1C1C1E] hover:bg-[#5b5c64]/10"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={
                otherProjects.length === 0 || selectedCount === 0 || !targetId || Boolean(overLimit)
              }
              className="rounded-md bg-[#1C1C1E] px-4 py-2 text-sm font-medium text-[#FFFFFF] hover:bg-[#5b5c64] disabled:pointer-events-none disabled:opacity-40"
            >
              コピーする
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
