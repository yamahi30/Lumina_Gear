import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import type { NoteIdea, NoteIdeasData, ApiResponse } from '@contenthub/types';
import { generateId } from '@contenthub/utils';
import { ClaudeService } from '../services/claude';
import { isDriveEnabled } from '../config';
import { getDriveService } from '../services/drive-helper';
import { requireAuth } from './auth';

export const notesRouter = Router();

// 認証が必要なルートに適用
notesRouter.use(requireAuth);

// Claudeサービスインスタンス
const claudeService = new ClaudeService();

// 保存ディレクトリ
const NOTE_IDEAS_DIR = path.resolve(process.cwd(), '../../data/note-ideas');

// ディレクトリ確保
async function ensureNoteIdeasDir() {
  try {
    await fs.mkdir(NOTE_IDEAS_DIR, { recursive: true });
  } catch {
    // 既存の場合は無視
  }
}

// 記事案を読み込む
async function loadNoteIdeas(month: string): Promise<NoteIdeasData | null> {
  const filePath = path.join(NOTE_IDEAS_DIR, `${month}.json`);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as NoteIdeasData;
  } catch {
    return null;
  }
}

// 記事案を保存
async function saveNoteIdeas(data: NoteIdeasData): Promise<void> {
  await ensureNoteIdeasDir();
  const filePath = path.join(NOTE_IDEAS_DIR, `${data.month}.json`);
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

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

    // ファイルに保存
    await saveNoteIdeas(ideasData);

    // Google Driveに保存（有効な場合）
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          await driveService.saveNoteIdeas(ideasData);
          console.log('Note ideas saved to Google Drive');
        }
      } catch (driveError) {
        console.error('Failed to save note ideas to Drive:', driveError);
      }
    }

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

    const ideasData = await loadNoteIdeas(month);

    res.json({
      status: 'success',
      data: ideasData,
    });
  } catch (error) {
    console.error('Get note ideas error:', error);
    res.status(500).json({
      status: 'error',
      error: '取得に失敗しました',
    });
  }
});

/**
 * NOTE記事案を更新（承認・編集など）
 * PUT /api/notes/ideas/:month/:id
 */
notesRouter.put('/ideas/:month/:id', async (req, res) => {
  try {
    const { month, id } = req.params;
    const updates = req.body as Partial<NoteIdea>;

    const ideasData = await loadNoteIdeas(month);
    if (!ideasData) {
      return res.status(404).json({
        status: 'error',
        error: '記事案が見つかりません',
      });
    }

    const ideaIndex = ideasData.ideas.findIndex((idea) => idea.id === id);
    if (ideaIndex === -1) {
      return res.status(404).json({
        status: 'error',
        error: '記事案が見つかりません',
      });
    }

    // 更新
    ideasData.ideas[ideaIndex] = {
      ...ideasData.ideas[ideaIndex],
      ...updates,
    };

    await saveNoteIdeas(ideasData);

    // Google Driveに保存（有効な場合）
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          await driveService.saveNoteIdeas(ideasData);
          console.log('Note ideas synced to Google Drive after update');
        }
      } catch (driveError) {
        console.error('Failed to sync note ideas to Drive:', driveError);
      }
    }

    res.json({
      status: 'success',
      data: ideasData.ideas[ideaIndex],
    });
  } catch (error) {
    console.error('Update note idea error:', error);
    res.status(500).json({
      status: 'error',
      error: '更新に失敗しました',
    });
  }
});

/**
 * NOTE記事案を削除
 * DELETE /api/notes/ideas/:month/:id
 */
notesRouter.delete('/ideas/:month/:id', async (req, res) => {
  try {
    const { month, id } = req.params;

    const ideasData = await loadNoteIdeas(month);
    if (!ideasData) {
      return res.status(404).json({
        status: 'error',
        error: '記事案が見つかりません',
      });
    }

    const filteredIdeas = ideasData.ideas.filter((idea) => idea.id !== id);
    if (filteredIdeas.length === ideasData.ideas.length) {
      return res.status(404).json({
        status: 'error',
        error: '記事案が見つかりません',
      });
    }

    ideasData.ideas = filteredIdeas;
    await saveNoteIdeas(ideasData);

    // Google Driveに保存（有効な場合）
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          await driveService.saveNoteIdeas(ideasData);
          console.log('Note ideas synced to Google Drive after delete');
        }
      } catch (driveError) {
        console.error('Failed to sync note ideas to Drive:', driveError);
      }
    }

    res.json({
      status: 'success',
      data: { message: '削除しました' },
    });
  } catch (error) {
    console.error('Delete note idea error:', error);
    res.status(500).json({
      status: 'error',
      error: '削除に失敗しました',
    });
  }
});

/**
 * NOTE記事生成
 * POST /api/notes/generate-article
 */
notesRouter.post('/generate-article', async (req, res) => {
  try {
    const { type, title_idea, content_idea, style_guide } = req.body as {
      type: 'free_no_affiliate' | 'free_with_affiliate' | 'membership' | 'paid';
      title_idea?: string;
      content_idea?: string;
      style_guide?: string;
    };

    // 入力検証
    if (!type) {
      return res.status(400).json({
        status: 'error',
        error: '記事タイプは必須です',
      });
    }

    if (!title_idea && !content_idea) {
      return res.status(400).json({
        status: 'error',
        error: 'タイトル案または内容のいずれかは必須です',
      });
    }

    // Claude APIで記事生成
    const article = await claudeService.generateNoteArticle(
      type,
      title_idea || '',
      content_idea || '',
      style_guide
    );

    const response: ApiResponse<{ article: string }> = {
      status: 'success',
      data: { article },
    };

    res.json(response);
  } catch (error) {
    console.error('Article generation error:', error);
    res.status(500).json({
      status: 'error',
      error: '記事の生成に失敗しました',
    });
  }
});

/**
 * NOTE記事ブラッシュアップ
 * POST /api/notes/brush-up
 */
notesRouter.post('/brush-up', async (req, res) => {
  try {
    const { article, instruction } = req.body as {
      article: string;
      instruction: string;
    };

    // 入力検証
    if (!article || !instruction) {
      return res.status(400).json({
        status: 'error',
        error: '記事とブラッシュアップ指示は必須です',
      });
    }

    // Claude APIでブラッシュアップ
    const brushedUpArticle = await claudeService.brushUpNoteArticle(
      article,
      instruction
    );

    const response: ApiResponse<{ article: string }> = {
      status: 'success',
      data: { article: brushedUpArticle },
    };

    res.json(response);
  } catch (error) {
    console.error('Article brush-up error:', error);
    res.status(500).json({
      status: 'error',
      error: 'ブラッシュアップに失敗しました',
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
