'use client';

import { useState } from 'react';
import type { CalendarData, CalendarPlatformType } from '@contenthub/types';
import { Header } from '@/components/shared/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { CalendarForm, type CalendarGenerateRequest } from '@/components/calendar/CalendarForm';
import { CalendarTable } from '@/components/calendar/CalendarTable';
import { useGenerateCalendar, useRegenerateRow } from '@/hooks/api/useCalendar';

// 媒体ごとのカレンダーを保持
type CalendarStore = Partial<Record<CalendarPlatformType, CalendarData>>;

export default function CalendarPage() {
  const [calendars, setCalendars] = useState<CalendarStore>({});
  const [currentPlatform, setCurrentPlatform] = useState<CalendarPlatformType | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

  const generateMutation = useGenerateCalendar();
  const regenerateRowMutation = useRegenerateRow();

  // 現在表示中のカレンダー
  const currentCalendar = currentPlatform ? calendars[currentPlatform] : null;

  const handleGenerate = (request: CalendarGenerateRequest) => {
    setCurrentPlatform(request.platform);

    generateMutation.mutate(
      {
        platform: request.platform,
        start_date: request.startDate,
        frequency: request.frequency,
        apply_context: request.applyContext,
      },
      {
        onSuccess: (data) => {
          const existingCalendar = calendars[request.platform];

          if (existingCalendar) {
            // 既存のカレンダーに新しいデータをマージ（同じ日付のものは上書き）
            const newDate = data.posts[0]?.date;
            const existingPosts = existingCalendar.posts.filter((post) => post.date !== newDate);
            const mergedPosts = [...existingPosts, ...data.posts].sort((a, b) => {
              if (a.date !== b.date) return a.date.localeCompare(b.date);
              return (a.time || '').localeCompare(b.time || '');
            });
            setCalendars((prev) => ({
              ...prev,
              [request.platform]: { ...existingCalendar, posts: mergedPosts },
            }));
          } else {
            setCalendars((prev) => ({
              ...prev,
              [request.platform]: data,
            }));
          }
        },
        onError: (error) => {
          alert(`エラー: ${error.message}`);
        },
      }
    );
  };

  const handleRegenerateRow = (rowIndex: number, instruction?: string) => {
    if (!currentCalendar || !currentPlatform) return;

    setRegeneratingIndex(rowIndex);

    regenerateRowMutation.mutate(
      {
        calendar_id: currentCalendar.calendar_id,
        row_index: rowIndex,
        custom_instruction: instruction,
        current_post: currentCalendar.posts[rowIndex],
      },
      {
        onSuccess: (data) => {
          if (data.regenerated_post) {
            setCalendars((prev) => {
              const calendar = prev[currentPlatform];
              if (!calendar) return prev;
              const newPosts = [...calendar.posts];
              newPosts[rowIndex] = data.regenerated_post!;
              return {
                ...prev,
                [currentPlatform]: { ...calendar, posts: newPosts },
              };
            });
          }
          setRegeneratingIndex(null);
        },
        onError: (error) => {
          alert(`エラー: ${error.message}`);
          setRegeneratingIndex(null);
        },
      }
    );
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              コンテンツカレンダー
            </h1>
            <p className="text-sm text-gray-600">
              媒体ごとにSNS投稿計画を自動生成します
            </p>
          </div>

          <div className="space-y-8">
            {/* 設定フォーム */}
            <CalendarForm
              onSubmit={handleGenerate}
              isLoading={generateMutation.isPending}
            />

            {/* エラー表示 */}
            {generateMutation.isError && (
              <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700">
                エラーが発生しました: {generateMutation.error.message}
              </div>
            )}

            {/* 生成結果 */}
            {currentCalendar && (
              <CalendarTable
                calendar={currentCalendar}
                onRegenerateRow={handleRegenerateRow}
                isRegenerating={regenerateRowMutation.isPending}
                regeneratingIndex={regeneratingIndex}
              />
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
