---
paths:
  - "__tests__/**/*.{ts,tsx}"
  - "**/*.test.{ts,tsx}"
  - "**/*.spec.{ts,tsx}"
  - "vitest.config.ts"
---

# テスト規約

## フレームワーク

- Vitest + React Testing Library + jsdom

## ファイル配置

- テストは `__tests__/` ディレクトリに配置
- ディレクトリ構造はソースと対応させる（例: `__tests__/hooks/useAnalysis.test.ts`）

## モック

- `localStorage` はvitest-dom-mockを使用
- API呼び出しは`vi.fn()`でモック
