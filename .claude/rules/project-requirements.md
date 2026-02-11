# プロジェクト要件

## 技術制約

- **Next.js** + **TypeScript** による型安全な実装
- **Tailwind CSS 4.x**（最新設定方法準拠）
- **shadcn/ui** コンポーネントを積極活用
- **Vitest + React Testing Library** でのテスト実装

## デザイン制約

- **Apple Human Interface Guidelines** 準拠
- **Core Web Vitals** 最適化必須
- **アクセシビリティ** 考慮（WCAG 2.1 AA準拠）

## インフラ制約

- **静的ホスティング対応**（Vercel・Netlify等）

## セキュリティ制約

- **APIキーの公開利用禁止**
- `NEXT_PUBLIC_` プレフィックス付きでの使用禁止
- APIキーは `.env.local` に設定
