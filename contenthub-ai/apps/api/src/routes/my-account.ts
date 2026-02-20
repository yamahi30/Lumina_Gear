import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import type { MyAccountInfo, ApiResponse } from '@contenthub/types';
import { isDriveEnabled } from '../config';
import { getDriveService } from '../services/drive-helper';
import { requireAuth } from './auth';

export const myAccountRouter = Router();

// 認証が必要
myAccountRouter.use(requireAuth);

// ローカル保存ディレクトリ
const DATA_DIR = path.resolve(process.cwd(), '../../data/settings');
const MY_ACCOUNT_FILE = path.join(DATA_DIR, 'my-account.json');

// ディレクトリ確保
async function ensureDataDir() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // 既存の場合は無視
  }
}

// ローカルファイルから読み込み
async function loadLocal(): Promise<MyAccountInfo | null> {
  try {
    const content = await fs.readFile(MY_ACCOUNT_FILE, 'utf-8');
    return JSON.parse(content) as MyAccountInfo;
  } catch {
    return null;
  }
}

// ローカルファイルに保存
async function saveLocal(data: MyAccountInfo): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(MY_ACCOUNT_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * マイアカウント情報取得
 * GET /api/my-account
 */
myAccountRouter.get('/', async (req, res) => {
  try {
    let data: MyAccountInfo | null = null;

    // Google Driveから読み込み
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          data = await driveService.loadJson<MyAccountInfo>('Settings', 'my-account.json');
        }
      } catch (driveError) {
        console.error('Failed to load my-account from Drive:', driveError);
      }
    }

    // フォールバック: ローカルファイル
    if (!data) {
      data = await loadLocal();
    }

    // デフォルト値
    if (!data) {
      data = {
        account_policy: '',
        content_pillars: '',
        operation_rules: '',
        brand_voice: '',
        updated_at: new Date().toISOString(),
      };
    }

    const response: ApiResponse<MyAccountInfo> = {
      status: 'success',
      data,
    };

    res.json(response);
  } catch (error) {
    console.error('Get my-account error:', error);
    res.status(500).json({
      status: 'error',
      error: 'マイアカウント情報の取得に失敗しました',
    });
  }
});

/**
 * マイアカウント情報更新
 * PUT /api/my-account
 */
myAccountRouter.put('/', async (req, res) => {
  try {
    const { account_policy, content_pillars, operation_rules, brand_voice } = req.body as Partial<MyAccountInfo>;

    const data: MyAccountInfo = {
      account_policy: account_policy || '',
      content_pillars: content_pillars || '',
      operation_rules: operation_rules || '',
      brand_voice: brand_voice || '',
      updated_at: new Date().toISOString(),
    };

    // ローカルに保存
    await saveLocal(data);

    // Google Driveに保存
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          await driveService.saveJson('Settings', 'my-account.json', data);
          console.log('My account saved to Google Drive');
        }
      } catch (driveError) {
        console.error('Failed to save my-account to Drive:', driveError);
      }
    }

    const response: ApiResponse<MyAccountInfo> = {
      status: 'success',
      data,
    };

    res.json(response);
  } catch (error) {
    console.error('Update my-account error:', error);
    res.status(500).json({
      status: 'error',
      error: 'マイアカウント情報の更新に失敗しました',
    });
  }
});
