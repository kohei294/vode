/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  fileName: string | null;
  kind: 'list' | 'schedule';
  rowCount: number;
  onClose: () => void;
  onAppend: () => void;
  onReplace: () => void;
};

export function ImportCsvConfirmModal({ open, fileName, kind, rowCount, onClose, onAppend, onReplace }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const label = kind === 'list' ? 'リスト項目' : 'スケジュール行';

  return (
    <div
      className="fixed inset-0 z-[125] flex items-center justify-center bg-[#0d0d0f]/50 p-4 print:hidden"
      role="presentation"
      onMouseDown={(ev) => {
        if (ev.target === ev.currentTarget) onClose();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="import-csv-modal-title"
        aria-describedby="import-csv-modal-desc"
        className="w-full max-w-md overflow-hidden rounded-xl border border-[#5b5c64]/20 bg-[#FFFFFF] shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#5b5c64]/15 px-5 py-4">
          <div className="min-w-0">
            <h2 id="import-csv-modal-title" className="text-lg font-bold text-[#1C1C1E]">
              CSV を読み込みますか？
            </h2>
            <p id="import-csv-modal-desc" className="mt-2 text-sm leading-relaxed text-[#5b5c64]">
              現在のスライドに <strong className="font-semibold text-[#1C1C1E]">{label}</strong> を読み込みます。
              既存データを残して末尾に追加するか、置き換えるかを選んでください。
            </p>
            {fileName ? (
              <p className="mt-2 truncate text-xs text-[#5b5c64]">
                ファイル: <span className="font-mono text-[#1C1C1E]">{fileName}</span>
              </p>
            ) : null}
            <p className="mt-1 text-xs text-[#5b5c64]">
              読み込み件数: <span className="font-semibold text-[#1C1C1E]">{rowCount}</span> 件
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
        <div className="flex flex-wrap justify-end gap-2 border-t border-[#5b5c64]/10 bg-[#f9f9fa] px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#5b5c64]/30 bg-[#FFFFFF] px-4 py-2 text-sm font-medium text-[#1C1C1E] shadow-sm transition-colors hover:bg-[#5b5c64]/10"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onReplace}
            className="rounded-lg border border-[#5b5c64]/30 bg-[#FFFFFF] px-4 py-2 text-sm font-medium text-[#1C1C1E] shadow-sm transition-colors hover:bg-[#5b5c64]/10"
          >
            置き換え
          </button>
          <button
            type="button"
            onClick={onAppend}
            className="rounded-lg border border-[#1C1C1E] bg-[#1C1C1E] px-4 py-2 text-sm font-medium text-[#FFFFFF] shadow-sm transition-colors hover:bg-[#5b5c64]"
          >
            末尾に追加
          </button>
        </div>
      </div>
    </div>
  );
}
