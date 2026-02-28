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
  | 'HSP'
  | '家庭DX'
  | 'IT・AI'
  | 'マインド'
  | 'NOTE誘導'
  | 'プロフィール'
  | '副収入'
  | 'Tips';

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

// 文体学習関連
export type StyleType =
  | 'note_free'
  | 'note_affiliate'
  | 'note_membership'
  | 'note_paid'
  | 'x_style'
  | 'threads_style';

// スタイルガイドのプラットフォーム（6種類）
export type StyleGuideType = 'x' | 'threads' | 'note_free' | 'note_affiliate' | 'note_membership' | 'note_paid';

export interface LearnedCharacteristics {
  // 文体特性
  tone: string;
  sentence_endings: string[];
  emoji_usage: string;
  paragraph_style: string;
  keywords: string[];
  // 構造特性
  intro_patterns?: string[];      // 導入パターン
  body_structure?: string;        // 本文構成
  closing_patterns?: string[];    // 締めくくりパターン
  heading_style?: string;         // 見出しスタイル
  transition_phrases?: string[];  // 繋ぎ言葉
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

// カテゴリ設定
export interface CategoryConfig {
  id: string;
  name: string;
  description?: string;
  percentage: number; // 配分比率（0-100）
  color?: string;     // 表示色
}

export interface CategorySettings {
  categories: CategoryConfig[];
  updated_at: string;
}

// 市場調査
export interface MarketResearch {
  content: string;               // 市場調査・トレンド情報
  updated_at: string;
}

// 競合分析
export interface CompetitorAnalysis {
  content: string;               // 競合分析情報
  updated_at: string;
}

// カスタム指示
export interface CustomInstructions {
  content: string;               // AIへのカスタム指示
  updated_at: string;
}

// マイアカウント情報
export interface MyAccountInfo {
  account_policy: string;        // アカウント方針
  content_pillars: string;       // 発信の軸・テーマ
  operation_rules: string;       // 運用ルール
  brand_voice: string;           // ブランドボイス・トーン
  updated_at: string;
}

// ペルソナデータ（ターゲット読者の人物像）
export interface PersonaData {
  id?: string;                   // ペルソナID（複数保存時に使用）
  name?: string;                 // ペルソナ名（識別用）
  ageRange: string;              // 年代
  gender: string;                // 性別
  occupation: string;            // 職業・立場
  problems: string[];            // 悩み・課題
  interests: string[];           // 興味・関心
  personaExample: {              // ペルソナ例
    name: string;
    age: number;
    job: string;
    description: string;
  };
  updated_at: string;
}

// 保存されたペルソナ一覧（統合版）
export interface PersonaList {
  personas: PersonaData[];
  activePersonaId?: string;    // 現在選択されているペルソナのID
  updated_at: string;
}

// コンテキスト管理（全設定を統合したもの - カレンダー生成時に使用）
export interface ContentContext {
  market_research: string;       // 市場調査・トレンド
  custom_instructions: string;   // カスタム指示
  persona?: PersonaData;         // ペルソナ情報
  updated_at: string;
}

// カレンダー生成用プラットフォームタイプ
export type CalendarPlatformType =
  | 'x'
  | 'threads'
  | 'note_free_no_affiliate'
  | 'note_free_with_affiliate'
  | 'note_membership'
  | 'note_paid';

// 投稿済み（良い投稿）
export interface PostedPost extends GeneratedPost {
  posted_at: string;
}

// API使用量トラッキング
export type ApiProvider = 'gemini' | 'claude' | 'openai';

export interface ApiUsageRecord {
  timestamp: string;
  provider: ApiProvider;         // APIプロバイダ
  function_name: string;         // 呼び出し元機能
  model: string;                 // 使用モデル
  input_tokens: number;          // 入力トークン数
  output_tokens: number;         // 出力トークン数
  total_tokens: number;          // 合計トークン数
  estimated_cost_usd: number;    // 推定コスト（USD）
}

export interface ProviderUsage {
  calls: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost_usd: number;
  cost_jpy: number;
}

export interface MonthlyUsage {
  month: string;                 // YYYY-MM形式
  total_calls: number;           // API呼び出し回数
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  estimated_cost_jpy: number;    // 日本円換算
  by_provider: Record<ApiProvider, ProviderUsage>;  // プロバイダ別内訳
  by_function: Record<string, {  // 機能別内訳
    calls: number;
    tokens: number;
    cost_usd: number;
  }>;
  records: ApiUsageRecord[];     // 詳細レコード
}
