import { Router } from 'express';
import type { FrequencySettings, CalendarData, CalendarPost, ApiResponse } from '@contenthub/types';
import { formatDate, formatMonth, getDayOfWeek, getDaysInMonth } from '@contenthub/utils';
import { ClaudeService } from '../services/claude';
import { isClaudeEnabled } from '../config';

export const calendarRouter = Router();

/**
 * コンテンツカレンダー生成
 * POST /api/content-calendar/generate
 */
calendarRouter.post('/generate', async (req, res) => {
  try {
    const { start_date, frequency_settings } = req.body as {
      start_date: string;
      frequency_settings: FrequencySettings;
    };

    // 入力検証
    if (!start_date || !frequency_settings) {
      return res.status(400).json({
        status: 'error',
        error: '開始日と頻度設定は必須です',
      });
    }

    // カレンダーID生成
    const startDate = new Date(start_date);
    const calendarId = `calendar_${formatMonth(startDate)}`;

    let posts: CalendarPost[];

    // Claude APIでカレンダー生成（APIキーがある場合のみ）
    if (isClaudeEnabled()) {
      try {
        console.log('Generating calendar with Claude API...');
        const claudeService = new ClaudeService();
        posts = await claudeService.generateCalendar(startDate, frequency_settings);
      } catch (apiError) {
        // APIエラー（クレジット不足など）時はモックデータを使用
        console.error('Claude API error, using mock data:', apiError);
        posts = generateMockCalendarPosts(startDate, frequency_settings);
      }
    } else {
      console.log('Claude API key not set, using mock data...');
      posts = generateMockCalendarPosts(startDate, frequency_settings);
    }

    // レスポンスデータ
    const calendarData: CalendarData = {
      calendar_id: calendarId,
      start_date: start_date,
      end_date: getEndOfMonth(startDate),
      frequency_settings,
      posts,
    };

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

    // Claude APIで再生成（APIキーがある場合のみ）
    if (isClaudeEnabled()) {
      try {
        console.log('Regenerating row with Claude API...');
        const claudeService = new ClaudeService();
        regeneratedPost = await claudeService.regenerateRow(current_post, custom_instruction);
      } catch (apiError) {
        // APIエラー時はモック再生成を使用
        console.error('Claude API error, using mock regeneration:', apiError);
        regeneratedPost = generateMockRegeneratedPost(current_post, custom_instruction);
      }
    } else {
      console.log('Claude API key not set, using mock regeneration...');
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

    // TODO: Google Driveから取得
    // const driveService = new GoogleDriveService();
    // const calendar = await driveService.loadCalendar(id);

    res.json({
      status: 'success',
      data: null, // TODO: 実際のカレンダーデータ
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
  const categories = ['HSP共感', '家庭DX', 'IT資格', 'マインド', 'NOTE誘導'] as const;
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

// 仮のカレンダーデータ生成（テスト用）
function generateMockCalendarPosts(startDate: Date, settings: FrequencySettings): CalendarPost[] {
  const posts: CalendarPost[] = [];
  const year = startDate.getFullYear();
  const month = startDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);

  const xTimes = ['07:30', '12:30', '21:00'];
  const categories = ['HSP共感', '家庭DX', 'IT資格', 'マインド', 'NOTE誘導'] as const;

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = formatDate(date);
    const dayOfWeek = getDayOfWeek(date);

    // X投稿
    for (let i = 0; i < settings.x_per_day; i++) {
      posts.push({
        date: dateStr,
        day_of_week: dayOfWeek,
        time: xTimes[i] || '12:00',
        platform: 'X',
        category: categories[Math.floor(Math.random() * categories.length)],
        title_idea: `X投稿案 ${day}-${i + 1}`,
        purpose: '共感形成 → NOTE誘導',
        hashtags: ['#HSP', '#AI活用'],
      });
    }

    // Threads投稿
    for (let i = 0; i < settings.threads_per_day; i++) {
      posts.push({
        date: dateStr,
        day_of_week: dayOfWeek,
        time: '10:00',
        platform: 'Threads',
        category: categories[Math.floor(Math.random() * categories.length)],
        title_idea: `Threads投稿案 ${day}`,
        purpose: '深い共感形成',
        hashtags: ['#HSP', '#キャリア'],
      });
    }
  }

  return posts;
}
