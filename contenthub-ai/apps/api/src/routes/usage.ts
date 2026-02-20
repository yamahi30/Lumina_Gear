import { Router } from 'express';
import type { ApiResponse, MonthlyUsage } from '@contenthub/types';
import { usageTracker } from '../services/usage-tracker';
import { requireAuth } from './auth';

export const usageRouter = Router();

// 認証が必要
usageRouter.use(requireAuth);

/**
 * 今月のAPI使用量を取得
 * GET /api/usage/monthly
 */
usageRouter.get('/monthly', async (req, res) => {
  try {
    const usage = await usageTracker.getMonthlyUsage();

    const response: ApiResponse<MonthlyUsage> = {
      status: 'success',
      data: usage,
    };

    res.json(response);
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({
      status: 'error',
      error: 'API使用量の取得に失敗しました',
    });
  }
});
