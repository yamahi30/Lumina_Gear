import { Router } from 'express';
import type { CalendarData, CalendarPost, ApiResponse, ContentContext, CustomInstructions, CalendarPlatformType, PersonaData, CategorySettings, MyAccountInfo, ResearchNotes } from '@contenthub/types';
import { formatDate, formatMonth, getDayOfWeek, getDaysInMonth } from '@contenthub/utils';
import { GeminiService } from '../services/gemini';
import { isGeminiEnabled, isDriveEnabled } from '../config';
import { getDriveService } from '../services/drive-helper';
import { requireAuth } from './auth';
import fs from 'fs/promises';
import path from 'path';

// ローカルコンテキストファイルのパス
const CONTEXT_DIR = path.resolve(process.cwd(), '../../data/context');

// 媒体タイプから表示名を取得
const PLATFORM_LABELS: Record<CalendarPlatformType, string> = {
  x: 'X',
  threads: 'Threads',
  note_free_no_affiliate: 'NOTE無料（アフィなし）',
  note_free_with_affiliate: 'NOTE無料（アフィあり）',
  note_membership: 'NOTEメンバーシップ',
  note_paid: 'NOTE有料',
};

// 日単位生成の媒体かどうか
function isDailyPlatform(platform: CalendarPlatformType): boolean {
  return platform === 'x' || platform === 'threads';
}

// コンテキストを読み込むヘルパー関数（投稿ジャンル、ペルソナ、調査ノート、カスタム指示、マイアカウントを統合）
async function loadContext(req: import('express').Request): Promise<ContentContext | null> {
  let categories: CategorySettings['categories'] | undefined;
  let persona: PersonaData | undefined;
  let researchNotes: ResearchNotes['items'] | undefined;
  let customInstructions = '';
  let myAccount: MyAccountInfo | undefined;

  // Google Driveから読み込み
  if (isDriveEnabled()) {
    try {
      const driveService = await getDriveService(req);
      if (driveService) {
        // 投稿ジャンル
        const catData = await driveService.loadJson<CategorySettings>('Context', 'categories.json');
        if (catData?.categories) {
          categories = catData.categories;
        }
        // ペルソナ
        const personaData = await driveService.loadJson<PersonaData>('Context', 'persona.json');
        if (personaData) {
          persona = personaData;
        }
        // 調査ノート
        const rnData = await driveService.loadJson<ResearchNotes>('Context', 'research-notes.json');
        if (rnData?.items) {
          researchNotes = rnData.items;
        }
        // カスタム指示
        const ciData = await driveService.loadJson<CustomInstructions>('Context', 'custom-instructions.json');
        if (ciData?.content) {
          customInstructions = ciData.content;
        }
        // マイアカウント
        const maData = await driveService.loadJson<MyAccountInfo>('Context', 'my-account.json');
        if (maData) {
          myAccount = maData;
        }

        if (categories || persona || researchNotes || customInstructions || myAccount) {
          console.log('Context loaded from Google Drive');
          return {
            categories,
            persona,
            research_notes: researchNotes,
            custom_instructions: customInstructions,
            my_account: myAccount,
            updated_at: new Date().toISOString(),
          };
        }
      }
    } catch (driveError) {
      console.error('Failed to load context from Drive:', driveError);
    }
  }

  // フォールバック: ローカルファイル
  // 投稿ジャンル
  try {
    const catPath = path.join(CONTEXT_DIR, 'categories.json');
    const catContent = await fs.readFile(catPath, 'utf-8');
    const catData = JSON.parse(catContent) as CategorySettings;
    categories = catData.categories;
  } catch {
    // ファイルが存在しない場合は無視
  }

  // ペルソナ
  try {
    const personaPath = path.join(CONTEXT_DIR, 'persona.json');
    const personaContent = await fs.readFile(personaPath, 'utf-8');
    persona = JSON.parse(personaContent) as PersonaData;
  } catch {
    // ファイルが存在しない場合は無視
  }

  // 調査ノート
  try {
    const rnPath = path.join(CONTEXT_DIR, 'research-notes.json');
    const rnContent = await fs.readFile(rnPath, 'utf-8');
    const rnData = JSON.parse(rnContent) as ResearchNotes;
    researchNotes = rnData.items;
  } catch {
    // ファイルが存在しない場合は無視
  }

  // カスタム指示
  try {
    const ciPath = path.join(CONTEXT_DIR, 'custom-instructions.json');
    const ciContent = await fs.readFile(ciPath, 'utf-8');
    const ciData = JSON.parse(ciContent) as CustomInstructions;
    customInstructions = ciData.content || '';
  } catch {
    // ファイルが存在しない場合は無視
  }

  // マイアカウント
  try {
    const maPath = path.join(CONTEXT_DIR, 'my-account.json');
    const maContent = await fs.readFile(maPath, 'utf-8');
    myAccount = JSON.parse(maContent) as MyAccountInfo;
  } catch {
    // ファイルが存在しない場合は無視
  }

  if (categories || persona || researchNotes || customInstructions || myAccount) {
    console.log('Context loaded from local files');
    return {
      categories,
      persona,
      research_notes: researchNotes,
      custom_instructions: customInstructions,
      my_account: myAccount,
      updated_at: new Date().toISOString(),
    };
  }

  console.log('No context found');
  return null;
}

export const calendarRouter = Router();

// 認証が必要なルートに適用
calendarRouter.use(requireAuth);

/**
 * コンテンツカレンダー生成（媒体別）
 * POST /api/content-calendar/generate
 */
calendarRouter.post('/generate', async (req, res) => {
  try {
    const { platform, start_date, frequency, apply_context } = req.body as {
      platform: CalendarPlatformType;
      start_date: string;
      frequency: number;
      apply_context?: boolean;
    };

    // 入力検証
    if (!platform || !start_date || !frequency) {
      return res.status(400).json({
        status: 'error',
        error: '媒体、開始日、投稿頻度は必須です',
      });
    }

    const startDate = new Date(start_date);
    const platformLabel = PLATFORM_LABELS[platform];

    // カレンダーID生成（日単位の場合は日付を含める）
    const calendarId = isDailyPlatform(platform)
      ? `calendar_${platform}_${formatDate(startDate)}`
      : `calendar_${platform}_${formatMonth(startDate)}`;

    console.log(`Generating ${platformLabel} calendar...`);

    let posts: CalendarPost[];

    // コンテキストを読み込み（apply_contextがtrueの場合のみ）
    let context: ContentContext | null = null;
    if (apply_context !== false) {
      context = await loadContext(req);
      if (context) {
        console.log('Using context for calendar generation');
      }
    }

    // Gemini APIでカレンダー生成
    if (isGeminiEnabled()) {
      try {
        const geminiService = new GeminiService();
        posts = await geminiService.generatePlatformCalendar(
          platform,
          startDate,
          frequency,
          context
        );
        console.log(`Generated ${posts.length} posts for ${platformLabel}`);
      } catch (apiError) {
        console.error('Gemini API error, using mock data:', apiError);
        posts = generateMockPlatformPosts(platform, startDate, frequency);
      }
    } else {
      console.log('Gemini API key not set, using mock data...');
      posts = generateMockPlatformPosts(platform, startDate, frequency);
    }

    // レスポンスデータ
    const calendarData: CalendarData = {
      calendar_id: calendarId,
      start_date: start_date,
      end_date: isDailyPlatform(platform) ? start_date : getEndOfMonth(startDate),
      frequency_settings: {
        x_per_day: platform === 'x' ? frequency : 0,
        threads_per_day: platform === 'threads' ? frequency : 0,
        note_free_no_affiliate_per_month: platform === 'note_free_no_affiliate' ? frequency : 0,
        note_free_with_affiliate_per_month: platform === 'note_free_with_affiliate' ? frequency : 0,
        note_membership_per_month: platform === 'note_membership' ? frequency : 0,
        note_paid_per_month: platform === 'note_paid' ? frequency : 0,
      },
      posts,
    };

    // Google Driveに保存（有効な場合）
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          await driveService.saveCalendar(calendarData);
          console.log('Calendar saved to Google Drive');
        }
      } catch (driveError) {
        console.error('Failed to save calendar to Drive:', driveError);
      }
    }

    const response: ApiResponse<CalendarData> = {
      status: 'success',
      data: calendarData,
    };

    res.json(response);
  } catch (error) {
    console.error('Calendar generation error:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'カレンダー生成に失敗しました',
    });
  }
});

/**
 * カレンダー1行再生成
 * POST /api/content-calendar/regenerate-row
 */
calendarRouter.post('/regenerate-row', async (req, res) => {
  try {
    const { calendar_id, row_index, custom_instruction, current_post } = req.body as {
      calendar_id: string;
      row_index: number;
      custom_instruction?: string;
      current_post?: CalendarPost;
    };

    if (!current_post) {
      return res.status(400).json({
        status: 'error',
        error: '現在の投稿データが必要です',
      });
    }

    let regeneratedPost: CalendarPost;

    if (isGeminiEnabled()) {
      try {
        console.log('Regenerating row with Gemini API...');
        const geminiService = new GeminiService();
        regeneratedPost = await geminiService.regenerateRow(current_post, custom_instruction);
      } catch (apiError) {
        console.error('Gemini API error, using mock regeneration:', apiError);
        regeneratedPost = generateMockRegeneratedPost(current_post, custom_instruction);
      }
    } else {
      console.log('Gemini API key not set, using mock regeneration...');
      regeneratedPost = generateMockRegeneratedPost(current_post, custom_instruction);
    }

    res.json({
      status: 'success',
      data: {
        message: '再生成が完了しました',
        row_index,
        regenerated_post: regeneratedPost,
      },
    });
  } catch (error) {
    console.error('Row regeneration error:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : '行の再生成に失敗しました',
    });
  }
});

/**
 * カレンダー取得
 * GET /api/content-calendar/:id
 */
calendarRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    res.json({
      status: 'success',
      data: null,
    });
  } catch (error) {
    console.error('Calendar fetch error:', error);
    res.status(500).json({
      status: 'error',
      error: 'カレンダーの取得に失敗しました',
    });
  }
});

// ヘルパー関数
function getEndOfMonth(date: Date): string {
  const year = date.getFullYear();
  const month = date.getMonth();
  const lastDay = getDaysInMonth(year, month);
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
}

// モック再生成
function generateMockRegeneratedPost(
  currentPost: CalendarPost,
  customInstruction?: string
): CalendarPost {
  const categories = ['HSP', '家庭DX', 'IT・AI', 'マインド', 'NOTE誘導', 'Tips'] as const;
  const titles = [
    '再生成：朝の時間を味方につける',
    '再生成：疲れた心にそっと寄り添う言葉',
    '再生成：AI時代のキャリア戦略',
    '再生成：家事を時短する3つの方法',
    '再生成：HSPさんのための休日の過ごし方',
  ];

  return {
    ...currentPost,
    title_idea: customInstruction
      ? `【修正】${customInstruction}に基づく投稿案`
      : titles[Math.floor(Math.random() * titles.length)],
    category: categories[Math.floor(Math.random() * categories.length)],
  };
}

// 媒体別モックデータ生成
function generateMockPlatformPosts(
  platform: CalendarPlatformType,
  startDate: Date,
  frequency: number
): CalendarPost[] {
  const posts: CalendarPost[] = [];
  const year = startDate.getFullYear();
  const month = startDate.getMonth();
  const day = startDate.getDate();

  const categories = ['HSP', '家庭DX', 'IT・AI', 'マインド', 'NOTE誘導', 'Tips'] as const;

  if (isDailyPlatform(platform)) {
    // X, Threads: 指定日の1日分のみ生成
    const times = platform === 'x' ? ['07:30', '12:30', '21:00'] : ['10:00', '19:00'];
    const dateStr = formatDate(startDate);
    const dayOfWeek = getDayOfWeek(startDate);

    for (let i = 0; i < frequency; i++) {
      posts.push({
        date: dateStr,
        day_of_week: dayOfWeek,
        time: times[i % times.length],
        platform: platform === 'x' ? 'X' : 'Threads',
        category: categories[(day + i) % categories.length],
        title_idea: `${platform === 'x' ? 'X' : 'Threads'}投稿案（${month + 1}/${day}）#${i + 1}`,
        purpose: platform === 'x' ? '共感形成 → NOTE誘導' : '深い共感形成',
        hashtags: ['#HSP', '#繊細さん'],
      });
    }
  } else {
    // NOTE: 月単位
    const noteTypeLabel = PLATFORM_LABELS[platform];
    for (let i = 0; i < frequency; i++) {
      const publishDay = Math.floor((getDaysInMonth(year, month) / frequency) * i) + 1;
      const date = new Date(year, month, publishDay);
      const dateStr = formatDate(date);
      const dayOfWeek = getDayOfWeek(date);

      posts.push({
        date: dateStr,
        day_of_week: dayOfWeek,
        time: '',
        platform: 'NOTE',
        category: categories[i % categories.length],
        title_idea: `${noteTypeLabel}記事案 #${i + 1}`,
        purpose: platform.includes('paid') || platform.includes('membership') ? '収益化' : '認知拡大',
        hashtags: ['#NOTE', '#HSP'],
      });
    }
  }

  return posts;
}
