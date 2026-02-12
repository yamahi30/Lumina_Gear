'use client';

import { useState } from 'react';
import type { CalendarData, FrequencySettings } from '@contenthub/types';
import { Header } from '@/components/shared/Header';
import { CalendarForm } from '@/components/calendar/CalendarForm';
import { CalendarTable } from '@/components/calendar/CalendarTable';
import { useGenerateCalendar, useRegenerateRow } from '@/hooks/api/useCalendar';

export default function CalendarPage() {
  const [generatedCalendar, setGeneratedCalendar] = useState<CalendarData | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);

  const generateMutation = useGenerateCalendar();
  const regenerateRowMutation = useRegenerateRow();

  const handleGenerate = (startDate: string, settings: FrequencySettings) => {
    generateMutation.mutate(
      { start_date: startDate, frequency_settings: settings },
      {
        onSuccess: (data) => {
          setGeneratedCalendar(data);
        },
        onError: (error) => {
          alert(`エラー: ${error.message}`);
        },
      }
    );
  };

  const handleRegenerateRow = (rowIndex: number, instruction?: string) => {
    if (!generatedCalendar) return;

    setRegeneratingIndex(rowIndex);

    regenerateRowMutation.mutate(
      {
        calendar_id: generatedCalendar.calendar_id,
        row_index: rowIndex,
        custom_instruction: instruction,
        current_post: generatedCalendar.posts[rowIndex],
      },
      {
        onSuccess: (data) => {
          // 再生成された行でカレンダーを更新
          if (data.regenerated_post) {
            setGeneratedCalendar((prev) => {
              if (!prev) return prev;
              const newPosts = [...prev.posts];
              newPosts[rowIndex] = data.regenerated_post!;
              return { ...prev, posts: newPosts };
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            コンテンツカレンダー
          </h1>
          <p className="text-sm text-gray-600">
            1ヶ月分のSNS投稿計画を自動生成します
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
          {generatedCalendar && (
            <CalendarTable
              calendar={generatedCalendar}
              onRegenerateRow={handleRegenerateRow}
              isRegenerating={regenerateRowMutation.isPending}
              regeneratingIndex={regeneratingIndex}
            />
          )}
        </div>
      </main>
    </div>
  );
}
