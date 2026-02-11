import { Router } from 'express';
import type { StyleType, StyleLearningData, ApiResponse } from '@contenthub/types';
import { STYLE_TYPE_LABELS } from '@contenthub/constants';

export const styleRouter = Router();

/**
 * 文体学習実行
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

    // TODO: Claude APIで文体分析
    // const claudeService = new ClaudeService();
    // const characteristics = await claudeService.analyzeStyle(samples);

    // 仮のデータ
    const styleData: StyleLearningData = {
      type,
      samples,
      learned_characteristics: {
        tone: '共感的・温かい',
        sentence_endings: ['です', 'ます', 'ですね'],
        emoji_usage: '控えめ',
        paragraph_style: '短め',
        keywords: ['HSP', '繊細さん', 'AI活用'],
      },
      updated_at: new Date().toISOString(),
    };

    // TODO: Google Driveに保存
    // const driveService = new GoogleDriveService();
    // await driveService.saveStyleData(type, styleData);

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

/**
 * 学習済み文体データ取得
 * GET /api/style-learning/:type
 */
styleRouter.get('/:type', async (req, res) => {
  try {
    const { type } = req.params as { type: StyleType };

    // TODO: Google Driveから取得
    // const driveService = new GoogleDriveService();
    // const styleData = await driveService.loadStyleData(type);

    res.json({
      status: 'success',
      data: null, // TODO: 実際のスタイルデータ
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
