/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  fileName: string | null;
  projectCount: number;
  projectTitle?: string | null;
  mode: 'single' | 'all';
  onClose: () => void;
  onConfirm: () => void;
  onReplaceCurrent?: () => void;
};

export function ImportProjectsConfirmModal({
  open,
  fileName,
  projectCount,
  projectTitle,
  mode,
  onClose,
  onConfirm,
  onReplaceCurrent,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

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
        aria-labelledby="import-json-modal-title"
        aria-describedby="import-json-modal-desc"
        className="w-full max-w-md overflow-hidden rounded-xl border border-[#5b5c64]/20 bg-[#FFFFFF] shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#5b5c64]/15 px-5 py-4">
          <div className="min-w-0">
            <h2 id="import-json-modal-title" className="text-lg font-bold text-[#1C1C1E]">
              {mode === 'single' ? 'プロジェクトを読み込みますか？' : '全プロジェクトを復元しますか？'}
            </h2>
            {mode === 'single' ? (
              <p id="import-json-modal-desc" className="mt-2 text-sm leading-relaxed text-[#5b5c64]">
                読み込んだプロジェクトは、通常は
                <strong className="font-semibold text-[#1C1C1E]">新しいプロジェクトとして追加</strong>
                します。必要な場合だけ、現在開いているプロジェクトを置き換えられます。
              </p>
            ) : (
              <p id="import-json-modal-desc" className="mt-2 text-sm leading-relaxed text-[#5b5c64]">
                <strong className="font-semibold text-[#1C1C1E]">現在のすべてのプロジェクト</strong>
                を、このファイルの内容で置き換えます。ブラウザに保存されているデータも上書きされます。この操作は元に戻せません。
              </p>
            )}
            {fileName ? (
              <p className="mt-2 truncate text-xs text-[#5b5c64]">
                ファイル: <span className="font-mono text-[#1C1C1E]">{fileName}</span>
              </p>
            ) : null}
            {mode === 'single' && projectTitle ? (
              <p className="mt-1 truncate text-xs text-[#5b5c64]">
                プロジェクト: <span className="font-semibold text-[#1C1C1E]">{projectTitle}</span>
              </p>
            ) : (
              <p className="mt-1 text-xs text-[#5b5c64]">
                復元後のプロジェクト数: <span className="font-semibold text-[#1C1C1E]">{projectCount}</span> 件
              </p>
            )}
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
          {mode === 'single' && onReplaceCurrent ? (
            <button
              type="button"
              onClick={onReplaceCurrent}
              className="rounded-lg border border-[#5b5c64]/30 bg-[#FFFFFF] px-4 py-2 text-sm font-medium text-[#1C1C1E] shadow-sm transition-colors hover:bg-[#5b5c64]/10"
            >
              現在のプロジェクトを置き換え
            </button>
          ) : null}
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg border border-[#1C1C1E] bg-[#1C1C1E] px-4 py-2 text-sm font-medium text-[#FFFFFF] shadow-sm transition-colors hover:bg-[#5b5c64]"
          >
            {mode === 'single' ? '新規追加する' : '全プロジェクトを復元'}
          </button>
        </div>
      </div>
    </div>
  );
}
