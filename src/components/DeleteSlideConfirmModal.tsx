/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  slideLabel: string;
  onClose: () => void;
  onConfirm: () => void;
};

export function DeleteSlideConfirmModal({ open, slideLabel, onClose, onConfirm }: Props) {
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
        aria-labelledby="delete-slide-modal-title"
        aria-describedby="delete-slide-modal-desc"
        className="w-full max-w-md overflow-hidden rounded-xl border border-[#5b5c64]/20 bg-[#FFFFFF] shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#5b5c64]/15 px-5 py-4">
          <div className="min-w-0">
            <h2 id="delete-slide-modal-title" className="text-lg font-bold text-[#1C1C1E]">
              スライドを削除しますか？
            </h2>
            <p id="delete-slide-modal-desc" className="mt-2 text-sm leading-relaxed text-[#5b5c64]">
              <span className="font-semibold text-[#1C1C1E]">「{slideLabel}」</span>
              を削除すると、このスライドの内容は失われます。この操作は元に戻せません。
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
            onClick={onConfirm}
            className="rounded-lg border border-red-700 bg-red-700 px-4 py-2 text-sm font-medium text-[#FFFFFF] shadow-sm transition-colors hover:bg-red-800"
          >
            削除する
          </button>
        </div>
      </div>
    </div>
  );
}
