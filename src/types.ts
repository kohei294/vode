export type SlideType = 'concept' | 'grid' | 'split' | 'schedule' | 'list' | 'custom';

export interface BaseSlide {
  id: string;
  type: SlideType;
  headerTitle: string; // e.g., "デザインコンセプト"
}

export interface ConceptSlide extends BaseSlide {
  type: 'concept';
  mainHeadline: string;
  pills: string[];
  subHeadline: string;
  tags: string[];
}

export interface GridColumn {
  title: string; // e.g. "カラー"
  details: string; // image or icon proxy (can just be a text string for now, or object)
  descriptionTitle: string;
  descriptionText: string;
}

export interface GridSlide extends BaseSlide {
  type: 'grid';
  columns: GridColumn[];
}

export interface SplitSlide extends BaseSlide {
  type: 'split';
  /** 画像の https URL またはアップロードした data:image/*;base64 */
  leftImage: string;
  leftSubtext: string;
  badge: string; // e.g., "キャッチコピー案①"
  rightHeading: string;
  rightSubheading: string;
  rightDescription: string;
  rightList: string[]; // for features or points
}

export interface ScheduleRow {
  id: string;
  time: string;
  /** 撮影対象（例: 風景、モデル、商品） */
  shootingSubject?: string;
  sceneName: string;
  /** https URL または data URL */
  image: string;
  staffDetails: string;
  cameraNotes: string;
}

export interface ScheduleSlide extends BaseSlide {
  type: 'schedule';
  scheduleTitle: string;
  rows: ScheduleRow[];
}

export interface ListItem {
  id: string;
  title: string;
  /** Optional short label shown like a tag on each item. */
  tag?: string;
  description: string;
  /** Optional link shown under the item (https recommended). */
  url?: string;
}

export interface ListSlide extends BaseSlide {
  type: 'list';
  title: string;
  items: ListItem[];
}

export interface CustomSlide extends BaseSlide {
  type: 'custom';
  title: string;
  content: string;
  /** メイン画像。https URL または data URL */
  image: string;
  /** 2枚目（`portrait-3col` の右列など）。https URL または data URL */
  image2?: string;
  layout?:
    | 'text-left'
    | 'text-right'
    | 'text-only'
    | 'image-only'
    | 'top-bottom'
    /** 縦長の画像を左、テキストを右（object-contain） */
    | 'portrait-left'
    /** 縦長の画像を右、テキストを左 */
    | 'portrait-right'
    /** テキスト＋縦画像＋縦画像の3カラム */
    | 'portrait-3col';
}

export type Slide = ConceptSlide | GridSlide | SplitSlide | ScheduleSlide | ListSlide | CustomSlide;

export interface Project {
  id: string;
  title: string;
  company: string;
  date: string;
  /** ダッシュボード用。https URL または data URL */
  thumbnail: string;
  slides: Slide[];
}
