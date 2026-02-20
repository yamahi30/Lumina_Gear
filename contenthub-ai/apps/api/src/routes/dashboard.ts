import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import type { CalendarPost, ApiResponse, SavedPost } from '@contenthub/types';
import { isDriveEnabled } from '../config';
import { getDriveService } from '../services/drive-helper';
import { requireAuth } from './auth';

export const dashboardRouter = Router();

// 認証が必要
dashboardRouter.use(requireAuth);

// ローカルデータディレクトリ
const SAVED_POSTS_DIR = path.resolve(process.cwd(), '../../data/saved-posts');

/**
 * 今日のタスク取得
 * GET /api/dashboard/today
 */
dashboardRouter.get('/today', async (req, res) => {
  try {
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const monthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    let todayPosts: CalendarPost[] = [];

    // Google Driveからカレンダーを読み込み
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          const calendar = await driveService.loadCalendar(monthStr);
          if (calendar?.posts) {
            todayPosts = calendar.posts.filter(post => post.date === todayStr);
          }
        }
      } catch (driveError) {
        console.error('Failed to load calendar from Drive:', driveError);
      }
    }

    const response: ApiResponse<{ date: string; posts: CalendarPost[] }> = {
      status: 'success',
      data: {
        date: todayStr,
        posts: todayPosts,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Get today tasks error:', error);
    res.status(500).json({
      status: 'error',
      error: '今日のタスク取得に失敗しました',
    });
  }
});

/**
 * 保存BOX件数取得
 * GET /api/dashboard/saved-counts
 */
dashboardRouter.get('/saved-counts', async (req, res) => {
  try {
    let xCount = 0;
    let threadsCount = 0;

    // Google Driveから読み込み
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          const xPosts = await driveService.loadSavedPosts('x');
          const threadsPosts = await driveService.loadSavedPosts('threads');
          xCount = xPosts.length;
          threadsCount = threadsPosts.length;
        }
      } catch (driveError) {
        console.error('Failed to load saved posts from Drive:', driveError);
      }
    }

    // フォールバック: ローカルファイル
    if (xCount === 0 && threadsCount === 0) {
      try {
        const xFile = path.join(SAVED_POSTS_DIR, 'x_saved.json');
        const xContent = await fs.readFile(xFile, 'utf-8');
        const xPosts = JSON.parse(xContent) as SavedPost[];
        xCount = xPosts.length;
      } catch {
        // ファイルが存在しない
      }

      try {
        const threadsFile = path.join(SAVED_POSTS_DIR, 'threads_saved.json');
        const threadsContent = await fs.readFile(threadsFile, 'utf-8');
        const threadsPosts = JSON.parse(threadsContent) as SavedPost[];
        threadsCount = threadsPosts.length;
      } catch {
        // ファイルが存在しない
      }
    }

    const response: ApiResponse<{ x: number; threads: number; total: number }> = {
      status: 'success',
      data: {
        x: xCount,
        threads: threadsCount,
        total: xCount + threadsCount,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Get saved counts error:', error);
    res.status(500).json({
      status: 'error',
      error: '保存BOX件数取得に失敗しました',
    });
  }
});
