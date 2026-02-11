---
paths:
  - "components/**/*.{tsx,jsx}"
  - "app/**/*.{tsx,jsx}"
---

# Apple HIG準拠デザインシステム

Apple Human Interface Guidelines に基づくモダンUIデザイン規約。

## 基本原則

1. **背景**: グラデーションやメッシュ背景を活用
2. **シャドウ**: 多層シャドウで奥行きを表現（Tailwind標準shadow非推奨）
3. **角丸**: 最小12px、カード24px、モーダル28px
4. **グラスモーフィズム**: `backdrop-blur` + 半透明背景
5. **ボーダー**: 半透明（`border-white/20〜40`）
6. **ホバー**: 微細なスケール・リフトアニメーション
7. **アクティブ**: `scale(0.95)` で押し込み感

## 禁止事項

- 純白(#fff)や純黒(#000)の直接使用
- 4px未満の角丸
- 不透明ボーダー（`border-gray-*`等）

## コンポーネントパターン

### ヘッダー
```jsx
<header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-white/20">
```

### カード
```jsx
<div className="rounded-2xl bg-white/90 border border-white/30
                hover:scale-[1.01] hover:-translate-y-0.5 transition-transform">
```

### モーダル
```jsx
{/* オーバーレイ */}
<div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50" />
{/* 本体 */}
<div className="rounded-3xl border border-white/40 bg-white/90 backdrop-blur-xl">
```

## アニメーション

- イージング: `cubic-bezier(0.4, 0, 0.2, 1)`（標準）
- ホバー: 200-300ms
- フェード: 200ms
- スケール: 300ms

## タイポグラフィ

| 用途 | クラス |
|------|--------|
| ページタイトル | `text-lg font-semibold tracking-tight` |
| セクションタイトル | `text-base font-medium` |
| 本文 | `text-sm` |
| キャプション | `text-xs` |
