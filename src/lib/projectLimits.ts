/** JSON テキスト（インポート・localStorage）の上限 */
export const MAX_IMPORT_JSON_BYTES = 4_000_000;

export const MAX_PROJECTS = 80;
export const MAX_SLIDES_PER_PROJECT = 250;

export const MAX_ID_LEN = 200;
export const MAX_HEADER_TITLE = 500;
export const MAX_TITLE = 2000;
export const MAX_BODY = 80_000;
export const MAX_SHORT_FIELD = 4000;
export const MAX_URL_FIELD = 2048;

/**
 * img[src] に保存する文字列（https URL または data:image/*;base64）の最大長。
 * Firestore は 1 ドキュメント約 1MB 制限のため、巨大な data URL の連続投入を避ける。
 */
export const MAX_IMAGE_SRC_FIELD = 350_000;

/** ファイル選択から data URL にする際の元ファイルサイズ上限（バイト） */
export const MAX_LOCAL_IMAGE_FILE_BYTES = 250 * 1024;

export const MAX_PILLS = 50;
export const MAX_TAGS = 80;
export const MAX_GRID_COLUMNS = 12;
export const MAX_SCHEDULE_ROWS = 150;
export const MAX_LIST_ITEMS = 120;
export const MAX_RIGHT_LIST_LINES = 60;

const CUSTOM_LAYOUTS = new Set<string>([
  'text-left',
  'text-right',
  'text-only',
  'image-only',
  'top-bottom',
  'portrait-left',
  'portrait-right',
  'portrait-3col',
]);

export function isAllowedCustomLayout(v: string): boolean {
  return CUSTOM_LAYOUTS.has(v);
}
