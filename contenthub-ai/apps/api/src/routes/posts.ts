import { Router } from 'express';
import type { PostCondition, GeneratedPost, ApiResponse } from '@contenthub/types';
import { generateId } from '@contenthub/utils';

export const postsRouter = Router();

/**
 * 投稿生成
 * POST /api/posts/generate
 */
postsRouter.post('/generate', async (req, res) => {
  try {
    const { platform, conditions, count_per_condition } = req.body as {
      platform: 'x' | 'threads';
      conditions: PostCondition[];
      count_per_condition: number;
    };

    // 入力検証
    if (!platform || !conditions || conditions.length === 0) {
      return res.status(400).json({
        status: 'error',
        error: 'プラットフォームと条件は必須です',
      });
    }

    // TODO: Claude APIで投稿生成
    // const claudeService = new ClaudeService();
    // const posts = await claudeService.generatePosts(platform, conditions, count_per_condition);

    // 仮のデータ
    const posts: Record<string, GeneratedPost[]> = {};
    for (const condition of conditions) {
      posts[condition.category] = generateMockPosts(
        condition,
        count_per_condition || 30,
        platform
      );
    }

    const response: ApiResponse<typeof posts> = {
      status: 'success',
      data: posts,
    };

    res.json(response);
  } catch (error) {
    console.error('Post generation error:', error);
    res.status(500).json({
      status: 'error',
      error: '投稿生成に失敗しました',
    });
  }
});

/**
 * 投稿を保存BOXに追加
 * POST /api/posts/save
 */
postsRouter.post('/save', async (req, res) => {
  try {
    const { platform, post } = req.body as {
      platform: 'x' | 'threads';
      post: GeneratedPost;
    };

    // TODO: Google Driveに保存
    // const driveService = new GoogleDriveService();
    // await driveService.saveToBox(platform, post);

    res.json({
      status: 'success',
      data: { ...post, saved_at: new Date().toISOString() },
    });
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({
      status: 'error',
      error: '保存に失敗しました',
    });
  }
});

/**
 * 投稿済みとしてマーク（学習データに追加）
 * POST /api/posts/mark-posted
 */
postsRouter.post('/mark-posted', async (req, res) => {
  try {
    const { platform, post } = req.body as {
      platform: 'x' | 'threads';
      post: GeneratedPost;
    };

    // TODO: 学習フィードバックに追加
    // const driveService = new GoogleDriveService();
    // await driveService.addToGoodPosts(platform, post);

    res.json({
      status: 'success',
      data: { message: '投稿済みとして記録しました' },
    });
  } catch (error) {
    console.error('Mark posted error:', error);
    res.status(500).json({
      status: 'error',
      error: '記録に失敗しました',
    });
  }
});

/**
 * 投稿を削除（学習データに追加）
 * DELETE /api/posts/:id
 */
postsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { platform } = req.body as { platform: 'x' | 'threads' };

    // TODO: rejected_postsに追加
    // const driveService = new GoogleDriveService();
    // await driveService.addToRejectedPosts(platform, id);

    res.json({
      status: 'success',
      data: { message: '削除しました' },
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      status: 'error',
      error: '削除に失敗しました',
    });
  }
});

/**
 * 保存BOXの投稿一覧取得
 * GET /api/posts/saved/:platform
 */
postsRouter.get('/saved/:platform', async (req, res) => {
  try {
    const { platform } = req.params;

    // TODO: Google Driveから取得
    // const driveService = new GoogleDriveService();
    // const savedPosts = await driveService.getSavedPosts(platform);

    res.json({
      status: 'success',
      data: [], // TODO: 実際の保存済み投稿
    });
  } catch (error) {
    console.error('Get saved posts error:', error);
    res.status(500).json({
      status: 'error',
      error: '取得に失敗しました',
    });
  }
});

// 仮の投稿データ生成
function generateMockPosts(
  condition: PostCondition,
  count: number,
  platform: 'x' | 'threads'
): GeneratedPost[] {
  const maxLength = platform === 'x' ? 140 : 500;
  const posts: GeneratedPost[] = [];

  for (let i = 0; i < count; i++) {
    const content = `【${condition.category}】\n\n${condition.content_idea}についての投稿案 ${i + 1}\n\n${condition.hashtags}`;
    posts.push({
      id: generateId(),
      content: content.slice(0, maxLength),
      character_count: Math.min(content.length, maxLength),
      hashtags: condition.hashtags.split(' ').filter(Boolean),
      category: condition.category,
      created_at: new Date().toISOString(),
    });
  }

  return posts;
}
