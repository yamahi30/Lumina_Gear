import { Router } from 'express';
import { google } from 'googleapis';

export const authRouter = Router();

// OAuth2クライアントの設定
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// 必要なスコープ
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/gmail.send',
];

/**
 * Google OAuth認証URL取得
 * GET /api/auth/google
 */
authRouter.get('/google', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
  res.json({ url: authUrl });
});

/**
 * OAuth2コールバック
 * GET /api/auth/callback
 */
authRouter.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        status: 'error',
        error: '認証コードがありません',
      });
    }

    // トークン取得
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // ユーザー情報取得
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();

    // セッションまたはJWTで認証状態を管理
    // TODO: JWT生成してクッキーに設定

    // フロントエンドにリダイレクト
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard?auth=success`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      status: 'error',
      error: '認証に失敗しました',
    });
  }
});

/**
 * ログアウト
 * POST /api/auth/logout
 */
authRouter.post('/logout', (req, res) => {
  // セッションまたはJWTを無効化
  res.clearCookie('token');
  res.json({ status: 'success' });
});

/**
 * 現在のユーザー情報取得
 * GET /api/auth/me
 */
authRouter.get('/me', async (req, res) => {
  try {
    // TODO: セッションまたはJWTからユーザー情報を取得
    res.json({
      status: 'success',
      data: null, // 未認証の場合
    });
  } catch (error) {
    res.status(401).json({
      status: 'error',
      error: '認証が必要です',
    });
  }
});
