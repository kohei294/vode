import type {
  ConceptSlide,
  CustomSlide,
  GridSlide,
  ListSlide,
  ScheduleSlide,
  Slide,
  SplitSlide,
} from '../types';

export function createEmptySlide(type: Slide['type']): Slide {
  const id = crypto.randomUUID();
  const headerTitle = '新しいスライド';

  switch (type) {
    case 'concept': {
      const s: ConceptSlide = {
        id,
        type: 'concept',
        headerTitle,
        mainHeadline: 'タイトルを入力',
        pills: ['キーワード1', 'キーワード2'],
        subHeadline: 'サブタイトル',
        tags: ['タグ1', 'タグ2'],
      };
      return s;
    }
    case 'grid': {
      const s: GridSlide = {
        id,
        type: 'grid',
        headerTitle,
        columns: Array.from({ length: 4 }, () => ({
          title: '項目',
          details: '',
          descriptionTitle: 'タイトル',
          descriptionText: '説明文',
        })),
      };
      return s;
    }
    case 'split': {
      const s: SplitSlide = {
        id,
        type: 'split',
        headerTitle,
        badge: 'バッジ',
        leftImage: '',
        leftSubtext: 'サブテキスト',
        rightHeading: '見出し',
        rightSubheading: '小見出し',
        rightDescription: '説明文を入力してください。',
        rightList: [],
      };
      return s;
    }
    case 'schedule': {
      const s: ScheduleSlide = {
        id,
        type: 'schedule',
        headerTitle,
        scheduleTitle: 'スケジュール',
        rows: [
          {
            id: crypto.randomUUID(),
            time: '10:00 〜 11:00',
            shootingSubject: '風景',
            sceneName: 'Scene 01',
            image: '',
            staffDetails: '',
            cameraNotes: '',
          },
        ],
      };
      return s;
    }
    case 'list': {
      const s: ListSlide = {
        id,
        type: 'list',
        headerTitle,
        title: 'リストタイトル',
        items: [
          { id: crypto.randomUUID(), title: '項目1', description: '説明文を入力', url: '' },
          { id: crypto.randomUUID(), title: '項目2', description: '説明文を入力', url: '' },
        ],
      };
      return s;
    }
    case 'custom': {
      const s: CustomSlide = {
        id,
        type: 'custom',
        headerTitle,
        title: 'カスタムタイトル',
        content:
          '自由にテキストを入力できます。\n段落などを活用して構成を記載してください。',
        image: '',
        layout: 'text-left',
      };
      return s;
    }
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}
