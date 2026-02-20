import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import type { CategorySettings, CategoryConfig, ApiResponse } from '@contenthub/types';
import { isDriveEnabled } from '../config';
import { getDriveService } from '../services/drive-helper';
import { requireAuth } from './auth';

export const categoriesRouter = Router();

// 認証が必要
categoriesRouter.use(requireAuth);

// ローカル保存ディレクトリ
const SETTINGS_DIR = path.resolve(process.cwd(), '../../data/settings');

// ディレクトリ確保
async function ensureSettingsDir() {
  try {
    await fs.mkdir(SETTINGS_DIR, { recursive: true });
  } catch {
    // 既存の場合は無視
  }
}

// デフォルトカテゴリ
const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { id: 'hsp', name: 'HSP', description: 'HSP関連', percentage: 15, color: '#8B5CF6' },
  { id: 'home-dx', name: '家庭DX', description: '家庭のデジタル化・効率化', percentage: 15, color: '#10B981' },
  { id: 'it-ai', name: 'IT・AI', description: 'IT・AI関連の学習・情報', percentage: 15, color: '#3B82F6' },
  { id: 'mindset', name: 'マインド', description: 'マインドセット・考え方', percentage: 15, color: '#F59E0B' },
  { id: 'note-link', name: 'NOTE誘導', description: 'NOTE記事への誘導', percentage: 15, color: '#EC4899' },
  { id: 'tips', name: 'Tips', description: '小ネタ・お役立ち情報', percentage: 15, color: '#14B8A6' },
  { id: 'profile', name: 'プロフィール', description: '自己紹介・ブランディング', percentage: 5, color: '#6366F1' },
  { id: 'side-income', name: '副収入', description: '副業・収入関連', percentage: 5, color: '#F97316' },
];

/**
 * カテゴリ設定取得
 * GET /api/categories
 */
categoriesRouter.get('/', async (req, res) => {
  try {
    let data: CategorySettings | null = null;

    // Google Driveから読み込み
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          data = await driveService.loadJson<CategorySettings>('Settings', 'categories.json');
        }
      } catch (driveError) {
        console.error('Failed to load categories from Drive:', driveError);
      }
    }

    // フォールバック: ローカルファイル
    if (!data) {
      try {
        const filePath = path.join(SETTINGS_DIR, 'categories.json');
        const content = await fs.readFile(filePath, 'utf-8');
        data = JSON.parse(content) as CategorySettings;
      } catch {
        data = null;
      }
    }

    // デフォルト値
    if (!data) {
      data = {
        categories: DEFAULT_CATEGORIES,
        updated_at: new Date().toISOString(),
      };
    }

    const response: ApiResponse<CategorySettings> = {
      status: 'success',
      data,
    };

    res.json(response);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      status: 'error',
      error: 'カテゴリ設定の取得に失敗しました',
    });
  }
});

/**
 * カテゴリ設定更新
 * PUT /api/categories
 */
categoriesRouter.put('/', async (req, res) => {
  try {
    const { categories } = req.body as { categories: CategoryConfig[] };

    const data: CategorySettings = {
      categories: categories || DEFAULT_CATEGORIES,
      updated_at: new Date().toISOString(),
    };

    // ローカルに保存
    await ensureSettingsDir();
    const filePath = path.join(SETTINGS_DIR, 'categories.json');
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    // Google Driveに保存
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          await driveService.saveJson('Settings', 'categories.json', data);
          console.log('✅ Categories saved to Google Drive');
        } else {
          console.log('⚠️ Drive service not available (no tokens?)');
        }
      } catch (driveError) {
        console.error('Failed to save categories to Drive:', driveError);
      }
    } else {
      console.log('ℹ️ Google Drive disabled, saved locally only');
    }

    const response: ApiResponse<CategorySettings> = {
      status: 'success',
      data,
    };

    res.json(response);
  } catch (error) {
    console.error('Update categories error:', error);
    res.status(500).json({
      status: 'error',
      error: 'カテゴリ設定の更新に失敗しました',
    });
  }
});

/**
 * カテゴリ設定をデフォルトにリセット
 * POST /api/categories/reset
 */
categoriesRouter.post('/reset', async (req, res) => {
  try {
    const data: CategorySettings = {
      categories: DEFAULT_CATEGORIES,
      updated_at: new Date().toISOString(),
    };

    // ローカルに保存
    await ensureSettingsDir();
    const filePath = path.join(SETTINGS_DIR, 'categories.json');
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    // Google Driveに保存
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          await driveService.saveJson('Settings', 'categories.json', data);
          console.log('Categories reset and saved to Google Drive');
        }
      } catch (driveError) {
        console.error('Failed to save categories to Drive:', driveError);
      }
    }

    const response: ApiResponse<CategorySettings> = {
      status: 'success',
      data,
    };

    res.json(response);
  } catch (error) {
    console.error('Reset categories error:', error);
    res.status(500).json({
      status: 'error',
      error: 'カテゴリ設定のリセットに失敗しました',
    });
  }
});
