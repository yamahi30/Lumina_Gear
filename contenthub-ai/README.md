# ContentHub AI

HSP女性エンジニア向けSNS運用自動化アプリ

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router) + React + TypeScript + Tailwind CSS 4.x
- **バックエンド**: Express.js + TypeScript
- **状態管理**: Zustand + React Query
- **AI API**: Claude API + Gemini API
- **ストレージ**: Google Drive API
- **モノレポ**: Turborepo

## プロジェクト構造

```
contenthub-ai/
├── apps/
│   ├── web/                  # Next.js フロントエンド
│   │   ├── app/              # App Router ページ
│   │   ├── components/       # UIコンポーネント
│   │   ├── hooks/            # カスタムフック
│   │   ├── lib/              # ユーティリティ
│   │   └── store/            # Zustand ストア
│   └── api/                  # Express.js バックエンド
│       └── src/
│           ├── routes/       # APIルート
│           ├── services/     # 外部サービス連携
│           └── middleware/   # ミドルウェア
├── packages/
│   ├── types/                # 共有型定義
│   ├── constants/            # 共有定数
│   └── utils/                # 共有ユーティリティ
└── turbo.json
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.example` を `.env.local` にコピーして設定:

```bash
cp .env.example .env.local
```

必要な環境変数:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`: Google OAuth認証
- `CLAUDE_API_KEY`: Claude API
- `GEMINI_API_KEY`: Gemini API

### 3. 開発サーバーの起動

```bash
npm run dev
```

- フロントエンド: http://localhost:3000
- バックエンド: http://localhost:3001

## 主要機能

### Phase 1 実装済み
- [x] プロジェクト構造（Turborepoモノレポ）
- [x] 共有パッケージ（types, constants, utils）
- [x] Next.js App Router セットアップ
- [x] Express.js バックエンド セットアップ
- [x] Apple HIG準拠デザインコンポーネント
- [x] ダッシュボード UI
- [x] API ルート（カレンダー、投稿、文体学習、NOTE）
- [x] Claude API サービス
- [x] Google Drive サービス

### Phase 1 未実装
- [ ] Google OAuth認証フロー
- [ ] カレンダー生成ページ
- [ ] 投稿作成ページ
- [ ] 文体学習ページ
- [ ] React Query フック

## コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # プロダクションビルド
npm run lint     # ESLint実行
npm run test     # テスト実行
```
