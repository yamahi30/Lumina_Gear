import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';

// 環境変数の読み込み
dotenv.config();

// ルートのインポート
import { authRouter } from './routes/auth';
import { calendarRouter } from './routes/calendar';
import { postsRouter } from './routes/posts';
import { styleRouter } from './routes/style';
import { notesRouter } from './routes/notes';

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

// APIルート
app.use('/api/auth', authRouter);
app.use('/api/content-calendar', calendarRouter);
app.use('/api/posts', postsRouter);
app.use('/api/style-learning', styleRouter);
app.use('/api/notes', notesRouter);

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
});

export default app;
