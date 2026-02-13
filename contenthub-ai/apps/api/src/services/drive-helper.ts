import { google } from 'googleapis';
import { Request } from 'express';
import type { User } from '@contenthub/types';
import { getUserGoogleTokens } from '../routes/auth';
import { GoogleDriveService } from './google-drive';

/**
 * リクエストからGoogleDriveServiceを取得
 * ユーザーのトークンがない場合はnullを返す
 */
export async function getDriveService(req: Request): Promise<GoogleDriveService | null> {
  const user = (req as Request & { user?: User }).user;

  if (!user) {
    console.log('No user in request');
    return null;
  }

  const tokens = getUserGoogleTokens(user.id);

  if (!tokens || !tokens.accessToken) {
    console.log('No Google tokens for user:', user.id);
    return null;
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oauth2Client.setCredentials({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });

    // トークンリフレッシュのリスナーを設定
    oauth2Client.on('tokens', (newTokens) => {
      console.log('Google tokens refreshed');
      // 新しいトークンを保存する処理を追加可能
    });

    return new GoogleDriveService(oauth2Client);
  } catch (error) {
    console.error('Failed to create Drive service:', error);
    return null;
  }
}

/**
 * Google Drive保存を有効にするかどうか
 */
export function isDriveEnabled(): boolean {
  return process.env.USE_GOOGLE_DRIVE === 'true';
}
