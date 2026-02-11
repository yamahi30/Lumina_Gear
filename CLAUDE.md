# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## プロジェクト概要

ContentHub AI - HSP女性エンジニア向けSNS運用自動化アプリ（X、Threads、NOTE対応）

## コマンド

```bash
npm run dev           # 開発サーバー起動（HMR対応）
npm run build         # TypeScriptチェック + プロダクションビルド
npm run lint          # ESLint実行
npm run test          # テスト実行（watchモード）
npm run test:run      # テスト実行（単発）
npm run test:coverage # テストカバレッジ確認
```

## 技術スタック

- **フロントエンド**: Next.js (App Router) + React 18 + TypeScript + Tailwind CSS 4.x + shadcn/ui + Zustand + React Query
- **バックエンド**: Node.js v20+ + Express.js + node-cron
- **AI API**: Claude API（高品質生成）+ Gemini API（分析・コスト最適化）
- **外部連携**: Google Drive API、Gmail API、X API v2、Threads API、NOTE API
- **テスト**: Vitest + React Testing Library + jsdom
- **デプロイ**: Vercel（フロントエンド）+ Railway/Render（バックエンド）

## ディレクトリ構造

- `app/` - Next.js App Router（ページ・API routes）
- `components/` - UIコンポーネント
- `components/ui/` - shadcn/ui（自動生成、編集禁止）
- `hooks/` - カスタムフック
- `types/` - 型定義・定数
- `__tests__/` - Vitestテスト（ソースと同構造で配置）

## コーディング規約

- **言語**: コメント・UIテキストは日本語
- **TypeScript**: `any`型禁止、型安全性重視
- **React**: 関数コンポーネント + Hooks、ES6+構文
- **レスポンシブ**: モバイルファーストアプローチ

## Tailwind CSS 4.x 設定

```css
/* 正しい形式（4.x） */
@import "tailwindcss";

/* 旧形式（3.x）は使用禁止 */
/* @tailwind base; @tailwind components; @tailwind utilities; */
```

依存関係: `@tailwindcss/postcss` + `tailwindcss`

## Apple HIG準拠デザインシステム

### 基本ルール
- **角丸**: 最小12px、カード24px、モーダル28px
- **グラスモーフィズム**: `backdrop-blur` + 半透明背景（`bg-white/80-90`）
- **ボーダー**: 半透明のみ（`border-white/20〜40`）
- **シャドウ**: 多層シャドウで奥行き表現

### 禁止事項
- 純白(#fff)・純黒(#000)の直接使用
- 4px未満の角丸
- 不透明ボーダー（`border-gray-*`等）

### コンポーネントパターン

```jsx
// ヘッダー
<header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-white/20">

// カード
<div className="rounded-2xl bg-white/90 border border-white/30 hover:scale-[1.01] hover:-translate-y-0.5 transition-transform">

// モーダル
<div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
<div className="rounded-3xl border border-white/40 bg-white/90 backdrop-blur-xl">
```

### アニメーション
- ホバー: 200-300ms、微細なスケール・リフト
- アクティブ: `scale(0.95)` で押し込み感

## テスト規約

- テストは `__tests__/` にソースと対応する構造で配置
- `localStorage` は vitest-dom-mock を使用
- API呼び出しは `vi.fn()` でモック

## セキュリティ

- APIキーは `.env.local` に設定
- `NEXT_PUBLIC_` プレフィックスでの公開禁止
