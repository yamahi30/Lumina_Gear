import type { PostCategory, StyleType, NoteType, Platform } from '@contenthub/types';

// プラットフォーム
export const PLATFORMS: Platform[] = ['X', 'Threads', 'NOTE'];

// 投稿カテゴリ
export const POST_CATEGORIES: PostCategory[] = [
  'HSP共感',
  '家庭DX',
  'IT資格',
  'マインド',
  'NOTE誘導',
  'プロフィール',
  '副収入',
];

// カテゴリ配分（X投稿用）
export const CATEGORY_DISTRIBUTION: Record<PostCategory, number> = {
  'HSP共感': 0.21,
  '家庭DX': 0.23,
  'IT資格': 0.13,
  'マインド': 0.17,
  'NOTE誘導': 0.23,
  'プロフィール': 0.04,
  '副収入': 0.0,
};

// 文体タイプ
export const STYLE_TYPES: StyleType[] = [
  'note_free',
  'note_affiliate',
  'note_membership',
  'note_paid',
  'x_style',
  'threads_style',
];

// 文体タイプの表示名
export const STYLE_TYPE_LABELS: Record<StyleType, string> = {
  note_free: 'NOTE無料記事（アフィなし）',
  note_affiliate: 'NOTE無料記事（アフィあり）',
  note_membership: 'NOTEメンバーシップ記事',
  note_paid: 'NOTE有料記事',
  x_style: 'X投稿',
  threads_style: 'Threads投稿',
};

// NOTE記事タイプ
export const NOTE_TYPES: NoteType[] = [
  'free_no_affiliate',
  'free_with_affiliate',
  'membership',
  'paid',
];

// NOTE記事タイプの表示名
export const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  free_no_affiliate: '無料記事（アフィなし）',
  free_with_affiliate: '無料記事（アフィあり）',
  membership: 'メンバーシップ記事',
  paid: '有料記事',
};

// デフォルトの投稿頻度設定
export const DEFAULT_FREQUENCY_SETTINGS = {
  x_per_day: 3,
  threads_per_day: 1,
  note_free_no_affiliate_per_month: 4,
  note_free_with_affiliate_per_month: 2,
  note_membership_per_month: 3,
  note_paid_per_month: 1,
};

// デフォルトの投稿時間帯
export const DEFAULT_POST_TIMES = {
  X: ['07:30', '12:30', '21:00'],
  Threads: ['10:00'],
  NOTE: [null], // NOTEは時間指定なし
};

// アフィリエイト商材プリセット
export const AFFILIATE_PRESETS = [
  {
    category: 'ITスクール',
    items: [
      { name: 'TechAcademy', feature: '無料カウンセリングあり' },
      { name: '侍エンジニア', feature: 'マンツーマン指導' },
    ],
  },
  {
    category: 'IT転職',
    items: [
      { name: 'レバテックキャリア', feature: 'エンジニア特化' },
      { name: 'Green', feature: 'IT/Web業界専門' },
    ],
  },
  {
    category: '動画サブスク',
    items: [
      { name: 'U-NEXT', feature: '31日間無料' },
      { name: 'Amazonプライム', feature: '月額500円' },
    ],
  },
  {
    category: '物販',
    items: [
      { name: 'Amazon', feature: '豊富な品揃え' },
      { name: '楽天', feature: 'ポイント還元' },
    ],
  },
];

// Google Driveのフォルダパス
export const DRIVE_PATHS = {
  ROOT: 'ContentHub',
  CONTENT_CALENDAR: 'ContentCalendar',
  NOTE_IDEAS: 'NoteIdeas',
  STYLE_LEARNING: 'StyleLearning',
  POST_LEARNING: 'PostLearning',
  SAVED_POSTS: 'SavedPosts',
  SETTINGS: 'Settings',
};

// 文字数制限
export const CHARACTER_LIMITS = {
  X: 140,
  Threads: 500,
  NOTE_FREE: 2000,
  NOTE_AFFILIATE: 3000,
  NOTE_MEMBERSHIP: 2000,
  NOTE_PAID_STANDARD: 2000,
  NOTE_PAID_PREMIUM: 5000,
};
