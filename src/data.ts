import type { Slide } from './types';

/** Stable template IDs so storage / HMR does not reshuffle keys every load. */
export const defaultSlides: Slide[] = [
  {
    id: 'tpl-slide-concept',
    type: 'concept',
    headerTitle: 'デザインコンセプト',
    mainHeadline: '一番最初に相談したくなる\nプレス加工のプロフェッショナル',
    pills: ['安心して頼れる', '相談したくなる', '伴走してくれる'],
    subHeadline: 'をデザインで表現',
    tags: ['充実した設備', '量産を踏まえた試作・相談', '精度の高さ', '最適化・高効率化', '柔軟性', '量産性・試作・小ロット 全てに対応', '一貫して対応できる']
  },
  {
    id: 'tpl-slide-grid',
    type: 'grid',
    headerTitle: 'トーン＆マナー（エレメント）',
    columns: [
      {
        title: 'カラー',
        details: 'ブラック\n濃いブルー\nホワイト\nレッド',
        descriptionTitle: 'プロフェッショナル・熱意',
        descriptionText: '濃いブルーをベースに使用し、ロゴの赤をポイントでアクセントとして使用。\nプロフェッショナルな落ち着いた印象とお客様に寄り添う熱意を表現します。'
      },
      {
        title: 'フォント',
        details: 'Noto Sans JP\nMontserrat',
        descriptionTitle: '読みやすさ・熱意・親しみ',
        descriptionText: '和文では読みやすく現代的な印象のゴシック体を、英文はインパクトのあるモダンな書体で熱意と先進性を示しつつ、丸みを帯びた形状を選ぶことで、カジュアルで親しみが持てるような印象にいたします。'
      },
      {
        title: 'あしらい',
        details: '基本は直線\nポイントで角を丸める',
        descriptionTitle: '信頼感・熱意',
        descriptionText: '基本は直線的なデザインで落ち着いた印象にいたします。ボタンなどには角を取り入れ、アクセントとすることでカジュアルさと分かりやすさを担保します。'
      },
      {
        title: 'アニメーション',
        details: '・左から右へのスピード\n・多様なポイントで使用',
        descriptionTitle: '対応力・伴走のスピード感',
        descriptionText: 'スピード感でシンプルなアニメーションから、対応のスピード感・先進性を演出します。'
      }
    ]
  },
  {
    id: 'tpl-slide-split',
    type: 'split',
    headerTitle: 'メインビジュアル ｜ キャッチコピー案①',
    badge: 'キャッチコピー案①',
    leftImage: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&q=80',
    leftSubtext: '※イメージです',
    rightHeading: 'すべてやる。',
    rightSubheading: '“頼もしさ”の訴求',
    rightDescription: 'プレス加工のご要望に対する、対応力・総合力といった強みを言い切る形で力強く表現したキャッチコピー。プレス加工にまつわる課題を相談したくなるような「頼もしさ」といった印象を与えます。',
    rightList: ['解決しなかった品質問題、部品の製造——そのすべてを、私たちはやる。', '図面段階からお客様と共に歩み、最適仕様を追求する。', '大型小型も問わない。開発から製造、補給まで一貫して支える。', '精密プレス加工の課題を、すべてやる。それが、私たちの仕事だ。']
  },
  {
    id: 'tpl-slide-schedule',
    type: 'schedule',
    headerTitle: '11月14日（木） 株式会社●●様_本社動画撮影',
    scheduleTitle: '撮影スケジュール',
    rows: [
      {
        id: 'tpl-row-1',
        time: '10:40 〜 11:00',
        sceneName: '●Scene01-6\nプレス機が稼働しているシーン',
        image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80',
        staffDetails: '・1秒',
        cameraNotes: '場所：工場\n\nカメラマン：\n・陰影を強めに撮影\n・固定撮影'
      },
      {
        id: 'tpl-row-2',
        time: '11:00 〜 11:20',
        sceneName: '●Scene01-2\nレーザー加工で火花が飛び散っているシーン',
        image: 'https://images.unsplash.com/photo-1572295727871-7638149ea3d7?auto=format&fit=crop&w=400&q=80',
        staffDetails: '・2秒',
        cameraNotes: '場所：工場\n\nカメラマン：\n・陰影を強めに撮影\n・固定撮影'
      }
    ]
  }
];

export function cloneDefaultSlides(): Slide[] {
  return JSON.parse(JSON.stringify(defaultSlides)) as Slide[];
}
