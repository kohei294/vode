/**
 * スライド編集・印刷で使うキャンバス寸法（CSS px）。
 * 高さは A4 横（297mm × 210mm）と同じ縦横比（210/297）に近づけるための整数 px（画面レイアウト用）。
 *
 * PDF 印刷は `src/index.css` の `.vode-slide-print-canvas` と同じ比率（幅 1280px 固定時の A4 横）に揃える。
 */
export const SLIDE_CANVAS_W = 1280;
/** A4 横（297:210）と厳密に同じ縦横比。丸めないことで印刷スケールと一致する。 */
export const SLIDE_CANVAS_H = (SLIDE_CANVAS_W * 210) / 297;
