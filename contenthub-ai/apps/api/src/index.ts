import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';

// 環境変数の読み込み（カレントディレクトリの.envを読み込む）
// tsx実行時はapps/apiディレクトリから実行される
dotenv.config();
// 念のためapps/api/.envも試行
dotenv.config({ path: path.join(process.cwd(), '.env') });

// 設定
import { logApiMode, isDriveEnabled, isGeminiEnabled, isClaudeEnabled } from './config';

// ルートのインポート
import { authRouter } from './routes/auth';
import { calendarRouter } from './routes/calendar';
import { postsRouter } from './routes/posts';
import { styleRouter } from './routes/style';
import { notesRouter } from './routes/notes';
import { settingsRouter } from './routes/settings';
import { contextRouter } from './routes/context';
import { dashboardRouter } from './routes/dashboard';
import { myAccountRouter } from './routes/my-account';
import { usageRouter } from './routes/usage';
import { categoriesRouter } from './routes/categories';

const app = express();
const PORT = process.env.PORT || 3005;

// ミドルウェア
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// デバッグ用: 設定確認
app.get('/debug/config', (req, res) => {
  res.json({
    driveEnabled: isDriveEnabled(),
    geminiEnabled: isGeminiEnabled(),
    claudeEnabled: isClaudeEnabled(),
    env: {
      USE_GOOGLE_DRIVE: process.env.USE_GOOGLE_DRIVE,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? '***設定済み***' : '未設定',
    }
  });
});

// APIルート
app.use('/api/auth', authRouter);
app.use('/api/content-calendar', calendarRouter);
app.use('/api/posts', postsRouter);
app.use('/api/style-learning', styleRouter);
app.use('/api/notes', notesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/context', contextRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/my-account', myAccountRouter);
app.use('/api/usage', usageRouter);
app.use('/api/categories', categoriesRouter);

// エラーハンドリング
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    status: 'error',
    error: err.message || 'Internal server error',
  });
});

// サーバー起動
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  logApiMode();
});

export default app;
