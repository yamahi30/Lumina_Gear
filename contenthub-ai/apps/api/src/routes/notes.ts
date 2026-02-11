import { Router } from 'express';
import type { NoteIdea, NoteIdeasData, ApiResponse } from '@contenthub/types';
import { generateId, formatMonth } from '@contenthub/utils';

export const notesRouter = Router();

/**
 * NOTE記事案生成（1ヶ月分）
 * POST /api/notes/generate-ideas
 */
notesRouter.post('/generate-ideas', async (req, res) => {
  try {
    const { month, frequency_settings } = req.body as {
      month: string; // YYYY-MM形式
      frequency_settings: {
        note_free_no_affiliate_per_month: number;
        note_free_with_affiliate_per_month: number;
        note_membership_per_month: number;
        note_paid_per_month: number;
      };
    };

    // 入力検証
    if (!month || !frequency_settings) {
      return res.status(400).json({
        status: 'error',
        error: '対象月と頻度設定は必須です',
      });
    }

    // TODO: Claude APIで記事案生成
    // const claudeService = new ClaudeService();
    // const ideas = await claudeService.generateNoteIdeas(month, frequency_settings);

    // 仮のデータ
    const ideas = generateMockNoteIdeas(month, frequency_settings);

    const ideasData: NoteIdeasData = {
      month,
      ideas,
    };

    // TODO: Google Driveに保存
    // const driveService = new GoogleDriveService();
    // await driveService.saveNoteIdeas(ideasData);

    const response: ApiResponse<NoteIdeasData> = {
      status: 'success',
      data: ideasData,
    };

    res.json(response);
  } catch (error) {
    console.error('Note ideas generation error:', error);
    res.status(500).json({
      status: 'error',
      error: 'NOTE記事案の生成に失敗しました',
    });
  }
});

/**
 * NOTE記事案の個別再生成
 * POST /api/notes/regenerate-idea
 */
notesRouter.post('/regenerate-idea', async (req, res) => {
  try {
    const { idea_id, custom_instruction } = req.body as {
      idea_id: string;
      custom_instruction?: string;
    };

    // TODO: Claude APIで再生成
    // const claudeService = new ClaudeService();
    // const newIdea = await claudeService.regenerateNoteIdea(idea_id, custom_instruction);

    res.json({
      status: 'success',
      data: {
        message: '再生成が完了しました',
        idea_id,
      },
    });
  } catch (error) {
    console.error('Idea regeneration error:', error);
    res.status(500).json({
      status: 'error',
      error: '再生成に失敗しました',
    });
  }
});

/**
 * NOTE記事案を承認
 * POST /api/notes/approve-idea
 */
notesRouter.post('/approve-idea', async (req, res) => {
  try {
    const { idea_id } = req.body as { idea_id: string };

    // TODO: ステータスを更新してGoogle Driveに保存
    // const driveService = new GoogleDriveService();
    // await driveService.approveNoteIdea(idea_id);

    res.json({
      status: 'success',
      data: { message: '承認しました', idea_id },
    });
  } catch (error) {
    console.error('Approve idea error:', error);
    res.status(500).json({
      status: 'error',
      error: '承認に失敗しました',
    });
  }
});

/**
 * NOTE記事案取得
 * GET /api/notes/ideas/:month
 */
notesRouter.get('/ideas/:month', async (req, res) => {
  try {
    const { month } = req.params;

    // TODO: Google Driveから取得
    // const driveService = new GoogleDriveService();
    // const ideas = await driveService.loadNoteIdeas(month);

    res.json({
      status: 'success',
      data: null, // TODO: 実際のアイデアデータ
    });
  } catch (error) {
    console.error('Get note ideas error:', error);
    res.status(500).json({
      status: 'error',
      error: '取得に失敗しました',
    });
  }
});

// 仮のNOTE記事案生成
function generateMockNoteIdeas(
  month: string,
  settings: {
    note_free_no_affiliate_per_month: number;
    note_free_with_affiliate_per_month: number;
    note_membership_per_month: number;
    note_paid_per_month: number;
  }
): NoteIdea[] {
  const ideas: NoteIdea[] = [];
  const [year, monthNum] = month.split('-').map(Number);
  let day = 3;

  // 無料記事（アフィなし）
  for (let i = 0; i < settings.note_free_no_affiliate_per_month; i++) {
    ideas.push({
      id: generateId(),
      publish_date: `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      type: 'free_no_affiliate',
      title: `HSPエンジニアのための○○術 ${i + 1}`,
      summary: 'HSPあるあるの悩みに共感し、具体的な解決策を提示する記事',
      status: 'pending',
    });
    day += 7;
  }

  // 無料記事（アフィあり）
  for (let i = 0; i < settings.note_free_with_affiliate_per_month; i++) {
    ideas.push({
      id: generateId(),
      publish_date: `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      type: 'free_with_affiliate',
      title: `未経験からエンジニアになる方法 ${i + 1}`,
      summary: 'IT転職のノウハウを提供しつつ、スクールへ自然に誘導',
      status: 'pending',
      affiliate_info: {
        category: 'ITスクール',
        name: 'TechAcademy',
      },
    });
    day += 7;
  }

  // メンバーシップ記事
  for (let i = 0; i < settings.note_membership_per_month; i++) {
    ideas.push({
      id: generateId(),
      publish_date: `${year}-${String(monthNum).padStart(2, '0')}-${String(Math.min(day, 28)).padStart(2, '0')}`,
      type: 'membership',
      title: `【メンバー限定】今週のAI活用Q&A ${i + 1}`,
      summary: 'メンバーからの質問に回答する限定コンテンツ',
      status: 'pending',
    });
    day += 7;
  }

  // 有料記事
  for (let i = 0; i < settings.note_paid_per_month; i++) {
    ideas.push({
      id: generateId(),
      publish_date: `${year}-${String(monthNum).padStart(2, '0')}-15`,
      type: 'paid',
      title: 'HSP女性の転職完全マニュアル＋Notionテンプレート',
      summary: '転職ノウハウと情報資産（テンプレート）を提供する高単価記事',
      status: 'pending',
    });
  }

  return ideas;
}
