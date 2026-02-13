import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      {/* ヒーローセクション */}
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight mb-4">
          ContentHub AI
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          SNS運用を自動化して、あなたの発信をもっと輝かせる
        </p>

        {/* クイックアクション */}
        <div className="flex justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl bg-indigo-500/90 px-6 py-3 text-white font-medium
                       hover:bg-indigo-600/90 hover:scale-[1.02] hover:-translate-y-0.5
                       active:scale-95 transition-all duration-200
                       backdrop-blur-sm border border-indigo-400/30"
          >
            ダッシュボードへ
          </Link>
        </div>
      </div>

      {/* 機能紹介カード */}
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <FeatureCard
          title="コンテンツカレンダー"
          description="1ヶ月分のSNS投稿計画を自動生成"
          icon="📅"
        />
        <FeatureCard
          title="投稿作成"
          description="X・Threads向け投稿を30個一括生成"
          icon="✍️"
        />
        <FeatureCard
          title="文体学習"
          description="あなたの文体をAIが学習・再現"
          icon="🎨"
        />
      </div>
    </main>
  );
}

function FeatureCard({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div
      className="rounded-2xl bg-white/90 p-6 border border-white/30
                 backdrop-blur-xl
                 hover:scale-[1.02] hover:-translate-y-1
                 transition-all duration-200
                 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),0_2px_4px_-2px_rgba(0,0,0,0.1)]"
    >
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="text-base font-medium mb-2">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}
