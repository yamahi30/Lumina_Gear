import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import type {
  StyleType,
  StyleLearningData,
  StyleGuideType,
  StyleGuideInfo,
  StyleChatMessage,
  ApiResponse,
} from '@contenthub/types';
import { STYLE_TYPE_LABELS } from '@contenthub/constants';
import { ClaudeService } from '../services/claude';
import { isClaudeEnabled } from '../config';

export const styleRouter = Router();

// スタイルガイドファイルのパス設定
const STYLE_GUIDE_DIR = path.resolve(process.cwd(), '../../..');
const STYLE_GUIDE_FILES: Record<StyleGuideType, { label: string; fileName: string }> = {
  x: { label: 'X投稿', fileName: 'x_style_guide_v2.md' },
  threads: { label: 'Threads投稿', fileName: 'threads_style_guide_v2.md' },
  note: { label: 'NOTE記事', fileName: 'note_style_guide.md' },
};

// スタイル学習データの保存ディレクトリ
const STYLE_LEARNING_DATA_DIR = path.resolve(process.cwd(), '../../data/style-learning');

// StyleTypeからファイル名へのマッピング
const STYLE_TYPE_FILES: Record<StyleType, string> = {
  x_style: 'x_style.json',
  threads_style: 'threads_style.json',
  note_free: 'note_free.json',
  note_affiliate: 'note_affiliate.json',
  note_membership: 'note_membership.json',
  note_paid: 'note_paid.json',
};

// データディレクトリが存在することを確認
async function ensureDataDir() {
  try {
    await fs.mkdir(STYLE_LEARNING_DATA_DIR, { recursive: true });
  } catch {
    // ディレクトリが既に存在する場合は無視
  }
}

// ========================================
// 明示的なパスを持つルートを先に定義
// ========================================

/**
 * スタイルガイド一覧取得
 * GET /api/style-learning/guides
 */
styleRouter.get('/guides', async (req, res) => {
  try {
    const guides: { type: StyleGuideType; label: string; hasContent: boolean }[] = [];

    for (const [type, info] of Object.entries(STYLE_GUIDE_FILES)) {
      const filePath = path.join(STYLE_GUIDE_DIR, info.fileName);
      let hasContent = false;

      try {
        await fs.access(filePath);
        hasContent = true;
      } catch {
        hasContent = false;
      }

      guides.push({
        type: type as StyleGuideType,
        label: info.label,
        hasContent,
      });
    }

    res.json({
      status: 'success',
      data: guides,
    });
  } catch (error) {
    console.error('Get style guides error:', error);
    res.status(500).json({
      status: 'error',
      error: 'スタイルガイド一覧の取得に失敗しました',
    });
  }
});

/**
 * スタイルガイド取得
 * GET /api/style-learning/guides/:type
 */
styleRouter.get('/guides/:type', async (req, res) => {
  try {
    const { type } = req.params as { type: StyleGuideType };

    const guideInfo = STYLE_GUIDE_FILES[type];
    if (!guideInfo) {
      return res.status(400).json({
        status: 'error',
        error: '無効なスタイルガイドタイプです',
      });
    }

    const filePath = path.join(STYLE_GUIDE_DIR, guideInfo.fileName);

    let content = '';
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch {
      content = '';
    }

    const response: ApiResponse<StyleGuideInfo> = {
      status: 'success',
      data: {
        type,
        label: guideInfo.label,
        filePath: guideInfo.fileName,
        content,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Get style guide error:', error);
    res.status(500).json({
      status: 'error',
      error: 'スタイルガイドの取得に失敗しました',
    });
  }
});

/**
 * スタイルガイド更新
 * PUT /api/style-learning/guides/:type
 */
styleRouter.put('/guides/:type', async (req, res) => {
  try {
    const { type } = req.params as { type: StyleGuideType };
    const { content } = req.body as { content: string };

    const guideInfo = STYLE_GUIDE_FILES[type];
    if (!guideInfo) {
      return res.status(400).json({
        status: 'error',
        error: '無効なスタイルガイドタイプです',
      });
    }

    const filePath = path.join(STYLE_GUIDE_DIR, guideInfo.fileName);
    await fs.writeFile(filePath, content, 'utf-8');

    res.json({
      status: 'success',
      data: {
        message: 'スタイルガイドを更新しました',
        type,
      },
    });
  } catch (error) {
    console.error('Update style guide error:', error);
    res.status(500).json({
      status: 'error',
      error: 'スタイルガイドの更新に失敗しました',
    });
  }
});

/**
 * スタイル学習チャット
 * POST /api/style-learning/chat
 */
styleRouter.post('/chat', async (req, res) => {
  try {
    const { type, message, history } = req.body as {
      type: StyleGuideType;
      message: string;
      history?: StyleChatMessage[];
    };

    if (!type || !message) {
      return res.status(400).json({
        status: 'error',
        error: 'タイプとメッセージは必須です',
      });
    }

    const guideInfo = STYLE_GUIDE_FILES[type];
    if (!guideInfo) {
      return res.status(400).json({
        status: 'error',
        error: '無効なスタイルガイドタイプです',
      });
    }

    // 現在のスタイルガイドを読み込む
    const filePath = path.join(STYLE_GUIDE_DIR, guideInfo.fileName);
    let currentGuideContent = '';
    try {
      currentGuideContent = await fs.readFile(filePath, 'utf-8');
    } catch {
      currentGuideContent = '';
    }

    // Claude APIが使えない場合はモック応答
    if (!isClaudeEnabled()) {
      const mockResponse: StyleChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `（Claude APIが設定されていないため、モック応答です）

${guideInfo.label}のスタイルガイドについてのご質問ですね。

現在のスタイルガイドを確認しました。ご要望に応じて内容を調整できます。

具体的にどのような変更や追加をご希望ですか？例えば：
- 語尾のパターンを増やす
- 絵文字の使い方を調整する
- サンプル投稿を追加する
- NGワードを追加する

お気軽にお申し付けください。`,
        timestamp: new Date().toISOString(),
      };

      return res.json({
        status: 'success',
        data: {
          response: mockResponse,
          guideUpdated: false,
        },
      });
    }

    // Claude APIでチャット
    try {
      const claudeService = new ClaudeService();
      const { response, updatedContent } = await claudeService.styleLearningChat(
        type,
        guideInfo.label,
        currentGuideContent,
        message,
        history || []
      );

      // ガイドが更新された場合はファイルに保存
      let guideUpdated = false;
      if (updatedContent && updatedContent !== currentGuideContent) {
        await fs.writeFile(filePath, updatedContent, 'utf-8');
        guideUpdated = true;
      }

      const responseMessage: StyleChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
      };

      return res.json({
        status: 'success',
        data: {
          response: responseMessage,
          guideUpdated,
          updatedContent: guideUpdated ? updatedContent : undefined,
        },
      });
    } catch (apiError) {
      // Claude APIエラー時はモック応答を返す
      console.error('Claude API error, falling back to mock:', apiError);
      const mockResponse: StyleChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: `（Claude APIが現在利用できないため、モック応答です）

${guideInfo.label}のスタイルガイドについてのご質問ですね。

現在のスタイルガイドには以下のような内容が含まれています：
- 文体の基本方針
- 語尾ルール
- 絵文字ルール
- サンプル投稿集

具体的にどのような変更や追加をご希望ですか？
Claude APIが利用可能になれば、実際にガイドの更新を行えます。`,
        timestamp: new Date().toISOString(),
      };

      return res.json({
        status: 'success',
        data: {
          response: mockResponse,
          guideUpdated: false,
        },
      });
    }
  } catch (error) {
    console.error('Style chat error:', error);
    res.status(500).json({
      status: 'error',
      error: error instanceof Error ? error.message : 'チャットに失敗しました',
    });
  }
});

/**
 * 文体学習実行（分析+保存）
 * POST /api/style-learning/learn
 */
styleRouter.post('/learn', async (req, res) => {
  try {
    const { type, samples } = req.body as {
      type: StyleType;
      samples: string[];
    };

    // 入力検証
    if (!type || !samples || samples.length === 0) {
      return res.status(400).json({
        status: 'error',
        error: '文体タイプとサンプルは必須です',
      });
    }

    // ファイル名を取得
    const fileName = STYLE_TYPE_FILES[type];
    if (!fileName) {
      return res.status(400).json({
        status: 'error',
        error: '無効な文体タイプです',
      });
    }

    let styleData: StyleLearningData;

    // Claude APIで文体分析（エラー時はフォールバック）
    if (isClaudeEnabled()) {
      try {
        const claudeService = new ClaudeService();
        const characteristics = await claudeService.analyzeStyle(samples);

        styleData = {
          type,
          samples,
          learned_characteristics: characteristics,
          updated_at: new Date().toISOString(),
        };
      } catch (apiError) {
        console.error('Claude API error, using fallback:', apiError);
        // APIエラー時はフォールバックを使用
        styleData = {
          type,
          samples,
          learned_characteristics: {
            tone: '共感的・温かい（API未接続のためサンプル）',
            sentence_endings: ['です', 'ます', 'ですね'],
            emoji_usage: '控えめ',
            paragraph_style: '短め',
            keywords: ['HSP', '繊細さん', 'AI活用'],
          },
          updated_at: new Date().toISOString(),
        };
      }
    } else {
      // フォールバック: 仮のデータ
      styleData = {
        type,
        samples,
        learned_characteristics: {
          tone: '共感的・温かい（API未設定のためサンプル）',
          sentence_endings: ['です', 'ます', 'ですね'],
          emoji_usage: '控えめ',
          paragraph_style: '短め',
          keywords: ['HSP', '繊細さん', 'AI活用'],
        },
        updated_at: new Date().toISOString(),
      };
    }

    // データディレクトリを確保
    await ensureDataDir();

    // 分析結果をファイルに保存
    const filePath = path.join(STYLE_LEARNING_DATA_DIR, fileName);
    await fs.writeFile(filePath, JSON.stringify(styleData, null, 2), 'utf-8');

    const response: ApiResponse<StyleLearningData> = {
      status: 'success',
      data: styleData,
    };

    res.json(response);
  } catch (error) {
    console.error('Style learning error:', error);
    res.status(500).json({
      status: 'error',
      error: '文体学習に失敗しました',
    });
  }
});

// ========================================
// パラメータ付きルートは最後に定義
// ========================================

/**
 * 全ての文体タイプ一覧取得
 * GET /api/style-learning
 */
styleRouter.get('/', async (req, res) => {
  try {
    // TODO: 各タイプの学習状況を取得
    const types = Object.entries(STYLE_TYPE_LABELS).map(([type, label]) => ({
      type,
      label,
      hasData: false, // TODO: 実際のデータ有無
    }));

    res.json({
      status: 'success',
      data: types,
    });
  } catch (error) {
    console.error('Get styles error:', error);
    res.status(500).json({
      status: 'error',
      error: '取得に失敗しました',
    });
  }
});

/**
 * 学習済み文体データ取得
 * GET /api/style-learning/:type
 * 注意: このルートは最後に定義（他のルートとの競合を防ぐ）
 */
styleRouter.get('/:type', async (req, res) => {
  try {
    const { type } = req.params as { type: StyleType };

    // ファイル名を取得
    const fileName = STYLE_TYPE_FILES[type];
    if (!fileName) {
      return res.status(400).json({
        status: 'error',
        error: '無効な文体タイプです',
      });
    }

    const filePath = path.join(STYLE_LEARNING_DATA_DIR, fileName);

    // ファイルからデータを読み込む
    let styleData: StyleLearningData | null = null;
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      styleData = JSON.parse(fileContent) as StyleLearningData;
    } catch {
      // ファイルが存在しない場合はnullを返す
      styleData = null;
    }

    res.json({
      status: 'success',
      data: styleData,
    });
  } catch (error) {
    console.error('Get style error:', error);
    res.status(500).json({
      status: 'error',
      error: '取得に失敗しました',
    });
  }
});

/**
 * 文体サンプル保存
 * PUT /api/style-learning/:type
 */
styleRouter.put('/:type', async (req, res) => {
  try {
    const { type } = req.params as { type: StyleType };
    const { samples } = req.body as { samples: string[] };

    // 入力検証
    if (!samples || !Array.isArray(samples)) {
      return res.status(400).json({
        status: 'error',
        error: 'サンプルは配列形式で指定してください',
      });
    }

    // ファイル名を取得
    const fileName = STYLE_TYPE_FILES[type];
    if (!fileName) {
      return res.status(400).json({
        status: 'error',
        error: '無効な文体タイプです',
      });
    }

    // データディレクトリを確保
    await ensureDataDir();

    const filePath = path.join(STYLE_LEARNING_DATA_DIR, fileName);

    // 既存データを読み込む（あれば）
    let existingData: StyleLearningData | null = null;
    try {
      const fileContent = await fs.readFile(filePath, 'utf-8');
      existingData = JSON.parse(fileContent) as StyleLearningData;
    } catch {
      existingData = null;
    }

    // 新しいデータを作成（既存の分析結果は保持）
    const styleData: StyleLearningData = {
      type,
      samples,
      learned_characteristics: existingData?.learned_characteristics || {
        tone: '',
        sentence_endings: [],
        emoji_usage: '',
        paragraph_style: '',
        keywords: [],
      },
      updated_at: new Date().toISOString(),
    };

    // ファイルに保存
    await fs.writeFile(filePath, JSON.stringify(styleData, null, 2), 'utf-8');

    res.json({
      status: 'success',
      data: styleData,
    });
  } catch (error) {
    console.error('Save style samples error:', error);
    res.status(500).json({
      status: 'error',
      error: 'サンプルの保存に失敗しました',
    });
  }
});
