---
paths:
  - "**/*.css"
  - "tailwind.config.{js,ts,mjs}"
  - "postcss.config.{js,mjs}"
  - "app/globals.css"
---

# Tailwind CSS 4.x 設定ガイド

## 重要: 4.x系では設定方法が大幅に変更

従来の3.x系の設定方法では動作しない。

## 正しい設定

### 1. 依存関係

```bash
npm install @tailwindcss/postcss tailwindcss
```

### 2. CSS import形式

```css
/* 旧形式（3.x系）- 使用禁止 */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 新形式（4.x系）- これを使用 */
@import "tailwindcss";
```

### 3. 不要ファイル

- `postcss.config.js` は基本不要（4.x系）
- `tailwind.config.js` の不要なsafelistを削除

## トラブルシューティング

CSSが適用されない場合:
1. 設定ファイルを最初に疑う
2. package.jsonの依存関係とドキュメントの整合性確認
3. 公式ドキュメント参照: https://tailwindcss.com/docs/installation
