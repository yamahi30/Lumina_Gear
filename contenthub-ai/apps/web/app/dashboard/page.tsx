'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Inbox, CheckCircle2, Clock, Circle, Zap } from 'lucide-react';
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
import { useTodayTasks, useSavedCounts } from '@/hooks/api/useDashboard';
import { useMonthlyUsage } from '@/hooks/api/useUsage';

type TaskStatus = 'pending' | 'in_progress' | 'completed';

interface TaskWithStatus {
  id: string;
  platform: string;
  time: string;
  category: string;
  title_idea: string;
  status: TaskStatus;
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}

function DashboardContent() {
  const { data: user } = useCurrentUser();
  const { data: todayData, isLoading: isTodayLoading } = useTodayTasks();
  const { data: savedCounts, isLoading: isSavedLoading } = useSavedCounts();
  const { data: usage, isLoading: isUsageLoading } = useMonthlyUsage();

  // タスクのステータスを管理
  const [taskStatuses, setTaskStatuses] = useState<Record<string, TaskStatus>>({});

  // 時間帯による挨拶
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'おはようございます';
    if (hour < 18) return 'こんにちは';
    return 'こんばんは';
  };

  // タスクにステータスを付与
  const tasksWithStatus: TaskWithStatus[] = (todayData?.posts || []).map((post, index) => {
    const id = `${post.platform}-${post.time}-${index}`;
    return {
      id,
      platform: post.platform,
      time: post.time || '未定',
      category: post.category,
      title_idea: post.title_idea,
      status: taskStatuses[id] || 'pending',
    };
  });

  // ステータス別にカウント
  const statusCounts = {
    completed: tasksWithStatus.filter(t => t.status === 'completed').length,
    in_progress: tasksWithStatus.filter(t => t.status === 'in_progress').length,
    pending: tasksWithStatus.filter(t => t.status === 'pending').length,
  };

  const handleStatusChange = (taskId: string, status: TaskStatus) => {
    setTaskStatuses(prev => ({ ...prev, [taskId]: status }));
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
          {/* 左カラム: 今日のタスク（メイン） */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>今日のタスク</CardTitle>
                  {tasksWithStatus.length > 0 && (
                    <div className="flex items-center gap-3 text-xs">
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {statusCounts.completed}
                      </span>
                      <span className="flex items-center gap-1 text-amber-600">
                        <Clock className="w-3.5 h-3.5" />
                        {statusCounts.in_progress}
                      </span>
                      <span className="flex items-center gap-1 text-gray-400">
                        <Circle className="w-3.5 h-3.5" />
                        {statusCounts.pending}
                      </span>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isTodayLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : tasksWithStatus.length > 0 ? (
                  <div className="space-y-3">
                    {tasksWithStatus.map((task) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onStatusChange={handleStatusChange}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-3">今日のタスクはありません</p>
                    <Link href="/calendar">
                      <Button variant="primary">
                        カレンダーを作成する
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 右カラム: API使用量 + 保存ボックス + クイックアクション */}
          <div className="space-y-6">
            {/* API使用量 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  今月のAPI使用量
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isUsageLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : usage ? (
                  <div className="space-y-3">
                    {/* 合計コスト表示 */}
                    <div className="text-center p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-0.5">合計</p>
                      <p className="text-2xl font-bold text-indigo-600">
                        ¥{Math.round(usage.estimated_cost_jpy).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        ${usage.estimated_cost_usd.toFixed(4)} USD
                      </p>
                    </div>

                    {/* プロバイダ別コスト */}
                    {usage.by_provider && (
                      <div className="grid grid-cols-2 gap-2">
                        {/* Gemini */}
                        <div className="p-2 bg-blue-50 rounded-lg text-center">
                          <p className="text-xs text-blue-600 font-medium">Gemini</p>
                          <p className="text-sm font-bold text-blue-700">
                            ¥{Math.round(usage.by_provider.gemini?.cost_jpy || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-blue-500">
                            {usage.by_provider.gemini?.calls || 0}回
                          </p>
                        </div>
                        {/* Claude */}
                        <div className="p-2 bg-orange-50 rounded-lg text-center">
                          <p className="text-xs text-orange-600 font-medium">Claude</p>
                          <p className="text-sm font-bold text-orange-700">
                            ¥{Math.round(usage.by_provider.claude?.cost_jpy || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-orange-500">
                            {usage.by_provider.claude?.calls || 0}回
                          </p>
                        </div>
                      </div>
                    )}

                    {/* トークン使用量 */}
                    <div className="space-y-1 text-sm pt-2 border-t border-gray-100">
                      <div className="flex justify-between py-1">
                        <span className="text-gray-600">合計呼び出し</span>
                        <span className="font-medium">{usage.total_calls}回</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-gray-600">合計トークン</span>
                        <span className="font-medium">{usage.total_tokens.toLocaleString()}</span>
                      </div>
                    </div>

                    {/* 機能別内訳（上位3件） */}
                    {Object.keys(usage.by_function).length > 0 && (
                      <div className="pt-2 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-2">機能別（上位3件）</p>
                        <div className="space-y-1">
                          {Object.entries(usage.by_function)
                            .sort((a, b) => b[1].cost_usd - a[1].cost_usd)
                            .slice(0, 3)
                            .map(([name, data]) => (
                              <div key={name} className="flex justify-between text-xs">
                                <span className="text-gray-600 truncate">{formatFunctionName(name)}</span>
                                <span className="text-gray-500">¥{Math.round(data.cost_usd * 150)}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 text-sm py-4">
                    データがありません
                  </p>
                )}
              </CardContent>
            </Card>

            {/* 保存ボックス */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Inbox className="w-4 h-4" />
                  保存ボックス
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isSavedLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm">X投稿</span>
                      <span className="text-sm font-medium text-indigo-600">{savedCounts?.x || 0}件</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-gray-100">
                      <span className="text-sm">Threads投稿</span>
                      <span className="text-sm font-medium text-purple-600">{savedCounts?.threads || 0}件</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm font-medium">合計</span>
                      <span className="text-sm font-semibold">{savedCounts?.total || 0}件</span>
                    </div>
                    {(savedCounts?.total || 0) > 0 && (
                      <Link href="/posts/saved" className="inline-block mt-2">
                        <Button variant="ghost" size="sm">
                          保存ボックスを見る →
                        </Button>
                      </Link>
                    )}
                  </div>
                )}
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
          </div>
        </div>
      </main>
    </div>
  );
}

function TaskItem({
  task,
  onStatusChange,
}: {
  task: TaskWithStatus;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
}) {
  const statusConfig = {
    pending: {
      label: '未対応',
      icon: Circle,
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600',
      borderColor: 'border-gray-200',
    },
    in_progress: {
      label: '途中',
      icon: Clock,
      bgColor: 'bg-amber-50',
      textColor: 'text-amber-700',
      borderColor: 'border-amber-200',
    },
    completed: {
      label: '完了',
      icon: CheckCircle2,
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
    },
  };

  const config = statusConfig[task.status];
  const StatusIcon = config.icon;

  return (
    <div className={`p-4 rounded-xl border ${config.borderColor} ${config.bgColor} transition-all`}>
      <div className="flex items-start gap-4">
        {/* ステータス選択 */}
        <div className="flex flex-col gap-1">
          <button
            onClick={() => onStatusChange(task.id, 'completed')}
            className={`p-1.5 rounded-lg transition-colors ${
              task.status === 'completed'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-400 hover:text-green-500 border border-gray-200'
            }`}
            title="完了"
          >
            <CheckCircle2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onStatusChange(task.id, 'in_progress')}
            className={`p-1.5 rounded-lg transition-colors ${
              task.status === 'in_progress'
                ? 'bg-amber-500 text-white'
                : 'bg-white text-gray-400 hover:text-amber-500 border border-gray-200'
            }`}
            title="途中"
          >
            <Clock className="w-4 h-4" />
          </button>
          <button
            onClick={() => onStatusChange(task.id, 'pending')}
            className={`p-1.5 rounded-lg transition-colors ${
              task.status === 'pending'
                ? 'bg-gray-500 text-white'
                : 'bg-white text-gray-400 hover:text-gray-500 border border-gray-200'
            }`}
            title="未対応"
          >
            <Circle className="w-4 h-4" />
          </button>
        </div>

        {/* タスク内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${config.bgColor} ${config.textColor} font-medium`}>
              {config.label}
            </span>
            <span className="text-xs text-gray-500">{task.time}</span>
          </div>
          <p className={`font-medium ${task.status === 'completed' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
            {task.platform}: {task.category}
          </p>
          <p className={`text-sm mt-1 ${task.status === 'completed' ? 'text-gray-400' : 'text-gray-600'}`}>
            {task.title_idea}
          </p>
        </div>
      </div>
    </div>
  );
}

// 機能名を表示用に変換
function formatFunctionName(name: string): string {
  const nameMap: Record<string, string> = {
    'generateWeekCalendar': 'カレンダー生成',
    'generateCalendar_x': 'Xカレンダー',
    'generateCalendar_threads': 'Threadsカレンダー',
    'generateCalendar_note_free_no_affiliate': 'NOTE無料',
    'generateCalendar_note_free_with_affiliate': 'NOTEアフィ',
    'generateCalendar_note_membership': 'NOTEメンバー',
    'generateCalendar_note_paid': 'NOTE有料',
    'generatePosts_x': 'X投稿生成',
    'generatePosts_threads': 'Threads投稿生成',
    'regenerateRow': '行再生成',
    'generatePersona': 'ペルソナ生成',
  };
  return nameMap[name] || name;
}
