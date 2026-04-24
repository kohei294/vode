/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef } from 'react';
import { ImagePlus } from 'lucide-react';
import { readImageFileAsDataUrl } from '../lib/readLocalImageFile';
import { safeImageSrc } from '../lib/urls';

export type ImageSourceFieldProps = {
  label: string;
  value: string;
  onChange: (next: string) => void;
  /** テキスト欄からフォーカスが外れたとき（URL の正規化など） */
  onBlurCommit?: (raw: string) => void;
  placeholder?: string;
  hint?: string;
  reportError?: (message: string) => void;
};

export function ImageSourceField({
  label,
  value,
  onChange,
  onBlurCommit,
  placeholder = 'https://… の画像 URL',
  hint = 'URL を貼るか、下のボタンで PNG / JPEG / GIF / WebP をファイルから読み込めます。',
  reportError,
}: ImageSourceFieldProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const pickFile = () => fileRef.current?.click();

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const result = await readImageFileAsDataUrl(file);
    if (result.ok === false) {
      reportError?.(result.error);
      return;
    }
    onChange(result.dataUrl);
  };

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-[#5b5c64]">{label}</label>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlurCommit ? (e) => onBlurCommit(e.target.value) : undefined}
        className="w-full rounded border border-[#5b5c64]/30 px-3 py-2 text-sm text-[#1C1C1E] focus:border-[#1C1C1E] focus:outline-none"
      />
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
          className="hidden"
          onChange={onFileChange}
        />
        <button
          type="button"
          onClick={pickFile}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#5b5c64]/25 bg-[#FFFFFF] px-2.5 py-1.5 text-xs font-medium text-[#1C1C1E] shadow-sm transition-colors hover:border-[#1C1C1E] hover:bg-[#5b5c64]/10"
        >
          <ImagePlus size={14} className="shrink-0" aria-hidden />
          ファイルから読み込む
        </button>
      </div>
      {hint ? <p className="text-[11px] leading-snug text-[#5b5c64]">{hint}</p> : null}
    </div>
  );
}

/** 右パネル用: blur 時に http(s) / data URL のみ残す */
export function normalizeImageFieldValue(raw: string): string {
  const t = raw.trim();
  if (t === '') return '';
  return safeImageSrc(t) ?? '';
}
