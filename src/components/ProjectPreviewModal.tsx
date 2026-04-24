/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useCallback, useRef, useState, useLayoutEffect } from 'react';
import { SlideRenderer } from './SlideRenderer';
import type { Project } from '../types';
import { X, ChevronLeft, ChevronRight, GalleryHorizontal, Download } from 'lucide-react';
import { cn } from '../lib/utils';
import { SLIDE_CANVAS_H, SLIDE_CANVAS_W } from '../lib/slideDimensions';
import { SLIDE_TYPE_LABELS } from '../lib/slideLabels';

const SLIDE_W = SLIDE_CANVAS_W;
const SLIDE_H = SLIDE_CANVAS_H;

type Props = {
  open: boolean;
  project: Project | null;
  slideIndex: number;
  onSlideIndexChange: (index: number) => void;
  onClose: () => void;
  /** ブラウザの印刷ダイアログ（PDF 保存含む）を開く */
  onPrint?: () => void;
};

export function ProjectPreviewModal({
  open,
  project,
  slideIndex,
  onSlideIndexChange,
  onClose,
  onPrint,
}: Props) {
  const slides = project?.slides ?? [];
  const safeIndex = slides.length === 0 ? 0 : Math.min(Math.max(0, slideIndex), slides.length - 1);
  const slide = slides[safeIndex];
  const globalSettings = project
    ? { creationDate: project.date, targetCompany: project.company }
    : { creationDate: '', targetCompany: '' };

  const stageRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const [mainScale, setMainScale] = useState(1);

  const getFocusableElements = useCallback((root: HTMLElement) => {
    const sel =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])';
    return Array.from(root.querySelectorAll<HTMLElement>(sel)).filter((el) => {
      if (el.tabIndex === -1) return false;
      return el.offsetParent !== null || el.getClientRects().length > 0;
    });
  }, []);

  const goPrev = useCallback(() => {
    onSlideIndexChange(Math.max(0, safeIndex - 1));
  }, [safeIndex, onSlideIndexChange]);

  const goNext = useCallback(() => {
    onSlideIndexChange(Math.min(slides.length - 1, safeIndex + 1));
  }, [safeIndex, slides.length, onSlideIndexChange]);

  useLayoutEffect(() => {
    if (!open) return;
    const el = stageRef.current;
    if (!el) return;

    const update = () => {
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (w <= 0 || h <= 0) return;
      setMainScale(Math.min(1, w / SLIDE_W, h / SLIDE_H));
    };

    update();
    const ro = new ResizeObserver(() => {
      requestAnimationFrame(update);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [open, safeIndex, slide?.id]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const id = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });
    return () => {
      window.cancelAnimationFrame(id);
      previouslyFocusedRef.current?.focus?.({ preventScroll: true });
      previouslyFocusedRef.current = null;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goNext();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, goPrev, goNext]);

  useEffect(() => {
    if (!open) return;
    const onTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const root = dialogRef.current;
      if (!root.contains(document.activeElement)) return;
      const list = getFocusableElements(root);
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onTab, true);
    return () => document.removeEventListener('keydown', onTab, true);
  }, [open, getFocusableElements]);

  if (!open || !project || slides.length === 0 || !slide) {
    return null;
  }

  const handlePrint = () => {
    (onPrint ?? (() => window.print()))();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[#0d0d0f]/95 text-[#FFFFFF] print:static print:inset-auto print:z-auto print:h-auto print:min-h-0 print:overflow-visible print:bg-white print:text-[#1C1C1E]"
    >
      <div
        ref={dialogRef}
        className="flex min-h-0 flex-1 flex-col print:hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-modal-title"
        aria-describedby="preview-modal-desc"
      >
      <p id="preview-modal-desc" className="sr-only">
        左右矢印キーでスライドを切り替え、Esc で閉じます。Tab キーはこの画面内で循環します。PDF
        はブラウザの印刷から保存できます。
      </p>
      {/* ヘッダー：本文と同じ max-width・左右 padding */}
      <header className="shrink-0 w-full border-b border-white/10 bg-[#0d0d0f]/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1360px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <GalleryHorizontal size={20} className="shrink-0 text-white/70" aria-hidden />
            <div className="min-w-0">
              <h2 id="preview-modal-title" className="truncate text-sm font-semibold text-[#FFFFFF]">
                {project.title}
              </h2>
              <p className="truncate text-xs text-white/50">{project.company}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="hidden text-xs tabular-nums text-white/60 sm:inline">
              {safeIndex + 1} / {slides.length}
            </span>
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 rounded-lg border border-white/20 px-2.5 py-1.5 text-xs font-medium text-white/90 transition-colors hover:bg-white/10 sm:px-3"
              title="ブラウザの印刷を開き、PDF に保存できます。A4 横で 1 枚＝1 スライド。印刷の余白は「なし」推奨。"
              aria-label="印刷または PDF（ブラウザの印刷）"
            >
              <Download size={16} className="shrink-0" aria-hidden />
              <span className="hidden sm:inline" aria-hidden>
                PDF
              </span>
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-[#FFFFFF]"
              aria-label="プレビューを閉じる"
            >
              <X size={22} aria-hidden />
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* 本文：ヘッダーと同じ max-width・左右 padding（余白の基準を揃える） */}
        <div className="mx-auto flex w-full max-w-[1360px] flex-1 flex-col gap-4 px-4 py-4 sm:gap-5 sm:px-6 sm:py-5">
          {/* 左右ガター同寸法 + 中央 flex（スライド枠が画面中央で対称に収まる） */}
          <div className="flex min-h-0 w-full flex-1 items-stretch gap-3 sm:items-center">
            <div className="flex w-11 shrink-0 items-center justify-center sm:w-12">
              <button
                type="button"
                onClick={goPrev}
                disabled={safeIndex === 0}
                className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-30"
                aria-label="前のスライド"
              >
                <ChevronLeft size={24} />
              </button>
            </div>

            <div className="flex min-h-0 min-w-0 flex-1 items-center justify-center">
              <div
                ref={stageRef}
                className="flex w-full max-w-[min(100%,1280px)] items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-[#1a1a1c] shadow-2xl"
                style={{
                  aspectRatio: `${SLIDE_W} / ${SLIDE_H}`,
                  maxHeight: 'min(72vh, calc(100vh - 14rem))',
                }}
              >
                <div
                  className="shrink-0"
                  style={{
                    width: SLIDE_W,
                    height: SLIDE_H,
                    transform: `scale(${mainScale})`,
                    transformOrigin: 'center center',
                  }}
                >
                  <SlideRenderer slide={slide} globalSettings={globalSettings} />
                </div>
              </div>
            </div>

            <div className="flex w-11 shrink-0 items-center justify-center sm:w-12">
              <button
                type="button"
                onClick={goNext}
                disabled={safeIndex >= slides.length - 1}
                className="rounded-full bg-white/10 p-2 transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-30"
                aria-label="次のスライド"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          <p className="hidden text-center text-[11px] text-white/40 sm:block" aria-hidden>
            ← → で移動 · Esc で閉じる · Tab はこの画面内で循環します
          </p>

          {/* フィルムストリップ：上段と同じコンテナ幅＝左右余白一致 */}
          <div className="w-full shrink-0 border-t border-white/5 pt-3">
            <div className="mb-2 text-[11px] font-medium tracking-wide text-white/45">全スライド</div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSlideIndexChange(i)}
                  className={cn(
                    'flex w-[140px] shrink-0 flex-col overflow-hidden rounded-md border text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
                    i === safeIndex
                      ? 'border-white/80 ring-2 ring-inset ring-white/25'
                      : 'border-white/10 opacity-80 hover:border-white/30 hover:opacity-100'
                  )}
                  aria-label={`スライド ${i + 1}: ${s.headerTitle || SLIDE_TYPE_LABELS[s.type]}`}
                  aria-current={i === safeIndex ? 'true' : undefined}
                >
                  <div className="h-[79px] w-full shrink-0 overflow-hidden bg-[#2a2a2c]">
                    <div
                      style={{
                        width: SLIDE_W,
                        height: SLIDE_H,
                        transform: 'scale(0.109375)',
                        transformOrigin: 'top left',
                      }}
                    >
                      <SlideRenderer slide={s} globalSettings={globalSettings} />
                    </div>
                  </div>
                  <div className="flex min-h-[2.75rem] w-full min-w-0 flex-col justify-center border-t border-white/5 bg-[#1a1a1c] px-2 py-1.5">
                    <span className="font-mono text-[11px] text-white/45">{i + 1}</span>
                    <p className="line-clamp-2 w-full break-words text-[11px] leading-tight text-white/85">
                      {s.headerTitle || SLIDE_TYPE_LABELS[s.type]}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* 印刷時のみ：このプロジェクトの全スライド（ダッシュボードから開いても PDF 可能） */}
      <div className="hidden w-full print:block">
        {slides.map((s) => (
          <React.Fragment key={s.id}>
            <SlideRenderer slide={s} globalSettings={globalSettings} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
