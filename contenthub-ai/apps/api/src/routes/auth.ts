import { Router, Request, Response, NextFunction } from 'express';
import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import type { User, ApiResponse } from '@contenthub/types';

export const authRouter = Router();

// JWT設定（遅延評価）
const getJwtSecret = () => process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';
const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// 必要なスコープ
const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/drive.file',
];

// ユーザートークンストレージ（本番ではDBを使用）
const userTokens = new Map<string, { accessToken: string; refreshToken: string }>();

// OAuth2クライアント（遅延初期化）
type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;
let _oauth2Client: OAuth2Client | null = null;

function getOAuth2Client(): OAuth2Client {
  if (!_oauth2Client) {
    _oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3005/api/auth/callback'
    );
  }
  return _oauth2Client;
}

/**
 * JWTトークン生成
 */
function generateToken(user: User): string {
  return jwt.sign(user, getJwtSecret(), { expiresIn: JWT_EXPIRES_IN });
}

/**
 * JWTトークン検証
 */
function verifyToken(token: string): User | null {
  try {
    return jwt.verify(token, getJwtSecret()) as User;
  } catch {
    return null;
  }
}

/**
 * 認証ミドルウェア
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.status(401).json({
      status: 'error',
      error: '認証が必要です',
    });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({
      status: 'error',
      error: 'トークンが無効または期限切れです',
    });
  }

  // リクエストにユーザー情報を付加
  (req as Request & { user: User }).user = user;
  next();
}

/**
 * Google OAuth認証URL取得
 * GET /api/auth/google
 */
authRouter.get('/google', (req, res) => {
  const oauth2Client = getOAuth2Client();
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
  });
  res.json({
    status: 'success',
    data: { url: authUrl },
  });
});

/**
 * OAuth2コールバック
 * GET /api/auth/callback
 */
authRouter.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code || typeof code !== 'string') {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=no_code`);
    }

    const oauth2Client = getOAuth2Client();

    // トークン取得
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // ユーザー情報取得
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfoResponse = await oauth2.userinfo.get();
    const userInfo = userInfoResponse.data;

    if (!userInfo.id || !userInfo.email) {
      throw new Error('ユーザー情報の取得に失敗しました');
    }

    // ユーザーオブジェクト作成
    const user: User = {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name || userInfo.email.split('@')[0],
      picture: userInfo.picture || undefined,
    };

    // Google APIトークンを保存（Drive API用）
    if (tokens.access_token) {
      userTokens.set(user.id, {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token || '',
      });
    }

    // JWTトークン生成
    const jwtToken = generateToken(user);

    // クッキーに設定
    res.cookie('auth_token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
    });

    // フロントエンドにリダイレクト
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/dashboard`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/login?error=auth_failed`);
  }
});

/**
 * ログアウト
 * POST /api/auth/logout
 */
authRouter.post('/logout', (req, res) => {
  const token = req.cookies?.auth_token;

  if (token) {
    const user = verifyToken(token);
    if (user) {
      // Google APIトークンを削除
      userTokens.delete(user.id);
    }
  }

  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  res.json({
    status: 'success',
    data: { message: 'ログアウトしました' },
  });
});

/**
 * 現在のユーザー情報取得
 * GET /api/auth/me
 */
authRouter.get('/me', (req, res) => {
  const token = req.cookies?.auth_token;

  if (!token) {
    return res.json({
      status: 'success',
      data: null,
    });
  }

  const user = verifyToken(token);

  if (!user) {
    res.clearCookie('auth_token');
    return res.json({
      status: 'success',
      data: null,
    });
  }

  const response: ApiResponse<User> = {
    status: 'success',
    data: user,
  };

  res.json(response);
});

/**
 * ユーザーのGoogle APIトークン取得（内部用）
 */
export function getUserGoogleTokens(userId: string) {
  return userTokens.get(userId);
}
