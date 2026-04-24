import type { Slide } from '../types';

export const SLIDE_TYPE_LABELS: Record<Slide['type'], string> = {
  concept: 'コンセプト',
  grid: 'グリッド',
  split: '分割',
  schedule: 'スケジュール',
  list: 'リスト',
  custom: 'カスタム',
};
