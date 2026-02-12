'use client';

import Link from 'next/link';
import { Header } from '@/components/shared/Header';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useCurrentUser } from '@/hooks/api/useAuth';

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { data: user } = useCurrentUser();

  // 時間帯による挨拶
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'おはようございます';
    if (hour < 18) return 'こんにちは';
    return 'こんばんは';
  };

  return (
    <div className="min-h-screen">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* 挨拶 */}
        <div className="mb-8">
          <h1 className="text-lg font-semibold tracking-tight mb-1">
            {getGreeting()}{user?.name ? `、${user.name}さん` : ''}
          </h1>
          <p className="text-sm text-gray-600">
            今日も素敵な発信をしましょう
          </p>
        </div>

        {/* メインコンテンツ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左カラム: 今週の予定 + サマリー */}
          <div className="lg:col-span-2 space-y-6">
            {/* 今週のコンテンツ予定 */}
            <Card>
              <CardHeader>
                <CardTitle>今週のコンテンツ予定</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <ScheduleItem platform="X" count={21} unit="投稿予定（毎日3回）" />
                  <ScheduleItem platform="Threads" count={7} unit="投稿予定（毎日1回）" />
                  <ScheduleItem platform="NOTE" count={1} unit="メンバーシップ記事" />
                  <ScheduleItem platform="NOTE" count={1} unit="有料記事" />
                </div>
                <Link href="/calendar" className="inline-block mt-4">
                  <Button variant="ghost" size="sm">
                    コンテンツカレンダーを見る →
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* 今週のサマリー */}
            <Card>
              <CardHeader>
                <CardTitle>今週のサマリー</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="X フォロワー" value="1,523" change="+78" />
                  <StatCard label="NOTE PV" value="2,456" change="+567" />
                  <StatCard label="有料note売上" value="¥17,940" subtext="3部" />
                  <StatCard
                    label="メンバーシップ"
                    value="12人"
                    subtext="月額¥11,760"
                  />
                </div>
                <Link href="/analytics" className="inline-block mt-4">
                  <Button variant="ghost" size="sm">
                    詳細レポートを見る →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* 右カラム: タスク + クイックアクション */}
          <div className="space-y-6">
            {/* 今日のタスク */}
            <Card>
              <CardHeader>
                <CardTitle>今日のタスク</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <TaskItem time="7:30" label="X朝の投稿" />
                  <TaskItem time="12:30" label="X昼の投稿" />
                  <TaskItem time="21:00" label="X夜の投稿" />
                </div>
              </CardContent>
            </Card>

            {/* クイックアクション */}
            <Card>
              <CardHeader>
                <CardTitle>クイックアクション</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Link href="/posts">
                    <Button className="w-full" variant="primary">
                      投稿案を見る
                    </Button>
                  </Link>
                  <Link href="/notes">
                    <Button className="w-full" variant="secondary">
                      NOTE記事作成
                    </Button>
                  </Link>
                  <Link href="/calendar">
                    <Button className="w-full" variant="secondary">
                      カレンダー作成
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* 最新トレンド */}
            <Card>
              <CardHeader>
                <CardTitle>最新のトレンド分析</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li>• HSP向け転職サービスが新規ローンチ</li>
                  <li>• ChatGPT新機能: メモリ機能強化</li>
                  <li>• 高単価note販売数が前月比20%増</li>
                </ul>
                <Link href="/trends" className="inline-block mt-4">
                  <Button variant="ghost" size="sm">
                    詳細を見る →
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

function ScheduleItem({
  platform,
  count,
  unit,
}: {
  platform: string;
  count: number;
  unit: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium">{platform}</span>
      <span className="text-sm text-gray-600">
        {count} {unit}
      </span>
    </div>
  );
}

function StatCard({
  label,
  value,
  change,
  subtext,
}: {
  label: string;
  value: string;
  change?: string;
  subtext?: string;
}) {
  return (
    <div className="text-center p-3 rounded-xl bg-gray-50/50">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
      {change && (
        <p className="text-xs text-green-600 mt-1">{change} ↑</p>
      )}
      {subtext && (
        <p className="text-xs text-gray-500 mt-1">{subtext}</p>
      )}
    </div>
  );
}

function TaskItem({ time, label }: { time: string; label: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <input
        type="checkbox"
        className="h-4 w-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
      />
      <span className="text-xs text-gray-500 w-12">{time}</span>
      <span className="text-sm">{label}</span>
    </div>
  );
}
