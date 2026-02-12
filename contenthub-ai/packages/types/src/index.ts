// カレンダー関連
export interface FrequencySettings {
  x_per_day: number;
  threads_per_day: number;
  note_free_no_affiliate_per_month: number;
  note_free_with_affiliate_per_month: number;
  note_membership_per_month: number;
  note_paid_per_month: number;
}

export type Platform = 'X' | 'Threads' | 'NOTE';

export type PostCategory =
  | 'HSP共感'
  | '家庭DX'
  | 'IT資格'
  | 'マインド'
  | 'NOTE誘導'
  | 'プロフィール'
  | '副収入';

export interface CalendarPost {
  date: string;
  day_of_week: string;
  time: string;
  platform: Platform;
  category: PostCategory;
  title_idea: string;
  purpose: string;
  hashtags: string[];
}

export interface CalendarData {
  calendar_id: string;
  start_date: string;
  end_date: string;
  frequency_settings: FrequencySettings;
  posts: CalendarPost[];
}

// 投稿関連
export interface PostCondition {
  category: PostCategory;
  content_idea: string;
  purpose: string;
  hashtags: string;
}

export interface GeneratedPost {
  id: string;
  content: string;
  character_count: number;
  hashtags: string[];
  category: PostCategory;
  created_at: string;
}

export interface SavedPost extends GeneratedPost {
  saved_at: string;
}

export interface PostFeedback {
  good_posts: GeneratedPost[];
  rejected_posts: GeneratedPost[];
}

// 文体学習関連
export type StyleType =
  | 'note_free'
  | 'note_affiliate'
  | 'note_membership'
  | 'note_paid'
  | 'x_style'
  | 'threads_style';

// スタイルガイドのプラットフォーム（簡易版）
export type StyleGuideType = 'x' | 'threads' | 'note';

export interface LearnedCharacteristics {
  tone: string;
  sentence_endings: string[];
  emoji_usage: string;
  paragraph_style: string;
  keywords: string[];
}

export interface StyleLearningData {
  type: StyleType;
  samples: string[];
  learned_characteristics: LearnedCharacteristics;
  updated_at: string;
}

// スタイルチャット関連
export interface StyleChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface StyleGuideInfo {
  type: StyleGuideType;
  label: string;
  filePath: string;
  content: string;
}

// NOTE関連
export type NoteType =
  | 'free_no_affiliate'
  | 'free_with_affiliate'
  | 'membership'
  | 'paid';

export interface AffiliateInfo {
  category: string;
  name: string;
  url?: string;
  feature?: string;
}

export interface NoteIdea {
  id: string;
  publish_date: string;
  type: NoteType;
  title: string;
  summary: string;
  status: 'pending' | 'approved';
  affiliate_info?: AffiliateInfo;
}

export interface NoteIdeasData {
  month: string;
  ideas: NoteIdea[];
}

// 認証関連
export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
}

// API レスポンス
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  error?: string;
}
