/**
 * キャンバス上の contentEditable と右パネルの入力欄を突き合わせる ID（文字列は完全一致必須）。
 */
export const CF = {
  headerTitle: 'headerTitle',
  mainHeadline: 'mainHeadline',
  subHeadline: 'subHeadline',
  pills: 'pills',
  tags: 'tags',
  grid: (col: number, part: 'title' | 'details' | 'descriptionTitle' | 'descriptionText') => `grid:${col}:${part}`,
  splitBadge: 'badge',
  splitLeftSubtext: 'leftSubtext',
  splitRightHeading: 'rightHeading',
  splitRightSubheading: 'rightSubheading',
  splitRightDescription: 'rightDescription',
  splitRightList: 'rightList',
  scheduleTitle: 'scheduleTitle',
  scheduleRow: (rowId: string, part: 'time' | 'shootingSubject' | 'sceneName' | 'staffDetails' | 'cameraNotes') =>
    `schedule:${rowId}:${part}`,
  listTitle: 'listTitle',
  listItem: (itemId: string, part: 'title' | 'tag' | 'description') => `list:${itemId}:${part}`,
  customTitle: 'customTitle',
  customContent: 'customContent',
} as const;
