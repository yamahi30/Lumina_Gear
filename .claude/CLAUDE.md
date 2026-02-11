# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## コマンド

```bash
npm run dev           # 開発サーバー起動（HMR対応）
npm run build         # TypeScriptチェック + プロダクションビルド
npm run lint          # ESLint実行
npm run test          # テスト実行（watchモード）
npm run test:run      # テスト実行（単発）
npm run test:coverage # テストカバレッジ確認
npm run start         # プロダクションサーバー起動
```

## 技術スタック

Next.js + React + TypeScript + Tailwind CSS 4 + shadcn/ui

## ディレクトリ構造

- `app/` - Next.js App Router（ページ・API）
- `components/` - UIコンポーネント
- `components/ui/` - shadcn/ui（自動生成、編集非推奨）
- `hooks/` - カスタムフック
- `types/` - 型定義・定数
- `__tests__/` - Vitestテスト
