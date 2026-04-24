/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MAX_IMAGE_SRC_FIELD, MAX_LOCAL_IMAGE_FILE_BYTES } from './projectLimits';
import { safeImageSrc } from './urls';

const ALLOWED_MIME = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']);

export type ReadImageFileResult =
  | { ok: true; dataUrl: string }
  | { ok: false; error: string };

/**
 * ローカル画像ファイルを data URL に変換する（PNG / JPEG / GIF / WebP のみ）。
 * サイズ・形式・保存可能な data URL かを検証する。
 */
export function readImageFileAsDataUrl(file: File): Promise<ReadImageFileResult> {
  if (!ALLOWED_MIME.has(file.type)) {
    return Promise.resolve({
      ok: false,
      error: '対応しているのは PNG・JPEG・GIF・WebP です。',
    });
  }
  if (file.size > MAX_LOCAL_IMAGE_FILE_BYTES) {
    return Promise.resolve({
      ok: false,
      error: `画像ファイルは ${Math.round(MAX_LOCAL_IMAGE_FILE_BYTES / 1024)}KB 以下にしてください（保存データのサイズ制限のため）。`,
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string' || !result.startsWith('data:image/')) {
        resolve({ ok: false, error: '画像の読み込みに失敗しました。' });
        return;
      }
      if (result.length > MAX_IMAGE_SRC_FIELD) {
        resolve({
          ok: false,
          error: '変換後のデータが大きすぎます。解像度を下げるか、別の画像を試してください。',
        });
        return;
      }
      const safe = safeImageSrc(result);
      if (!safe) {
        resolve({ ok: false, error: 'この画像データは保存できません。別の形式を試してください。' });
        return;
      }
      resolve({ ok: true, dataUrl: safe });
    };
    reader.onerror = () => resolve({ ok: false, error: '画像の読み込みに失敗しました。' });
    reader.readAsDataURL(file);
  });
}
