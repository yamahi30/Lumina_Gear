'use client';

import { useState, useEffect } from 'react';
import type { NoteIdea } from '@contenthub/types';
import { Header } from '@/components/shared/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import {
  MonthSelector,
  FrequencySettingsForm,
  NoteIdeasList,
} from '@/components/notes';
import {
  useNoteIdeas,
  useGenerateNoteIdeas,
  useUpdateNoteIdea,
  useDeleteNoteIdea,
  type NoteFrequencySettings,
} from '@/hooks/api/useNotes';

// 現在の月をYYYY-MM形式で取得
function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

const defaultSettings: NoteFrequencySettings = {
  note_free_no_affiliate_per_month: 2,
  note_free_with_affiliate_per_month: 2,
  note_membership_per_month: 4,
  note_paid_per_month: 1,
};

export default function NotesPage() {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [settings, setSettings] = useState<NoteFrequencySettings>(defaultSettings);
  const [updatingIdeaId, setUpdatingIdeaId] = useState<string>();

  const { data: ideasData, isLoading } = useNoteIdeas(selectedMonth);
  const generateMutation = useGenerateNoteIdeas();
  const updateMutation = useUpdateNoteIdea();
  const deleteMutation = useDeleteNoteIdea();

  const handleGenerate = async () => {
    try {
      await generateMutation.mutateAsync({
        month: selectedMonth,
        frequencySettings: settings,
      });
    } catch (error) {
      console.error('Generate failed:', error);
    }
  };

  const handleApprove = async (ideaId: string) => {
    setUpdatingIdeaId(ideaId);
    try {
      await updateMutation.mutateAsync({
        month: selectedMonth,
        ideaId,
        updates: { status: 'approved' },
      });
    } catch (error) {
      console.error('Approve failed:', error);
    } finally {
      setUpdatingIdeaId(undefined);
    }
  };

  const handleEdit = async (ideaId: string, updates: Partial<NoteIdea>) => {
    setUpdatingIdeaId(ideaId);
    try {
      await updateMutation.mutateAsync({
        month: selectedMonth,
        ideaId,
        updates,
      });
    } catch (error) {
      console.error('Edit failed:', error);
    } finally {
      setUpdatingIdeaId(undefined);
    }
  };

  const handleDelete = async (ideaId: string) => {
    try {
      await deleteMutation.mutateAsync({
        month: selectedMonth,
        ideaId,
      });
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const ideas = ideasData?.ideas || [];

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">
                NOTE記事案
              </h1>
              <p className="text-sm text-gray-600">
                月別のNOTE記事案を生成・管理します
              </p>
            </div>
            <MonthSelector
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左側: 設定 */}
            <div className="lg:col-span-1 space-y-6">
              {/* 頻度設定 */}
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
                <h2 className="font-semibold text-gray-900 mb-4">頻度設定</h2>
                <FrequencySettingsForm
                  settings={settings}
                  onSettingsChange={setSettings}
                  onGenerate={handleGenerate}
                  isGenerating={generateMutation.isPending}
                />
              </div>

              {/* ヒント */}
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <h3 className="text-sm font-medium text-indigo-800 mb-2">
                  使い方のヒント
                </h3>
                <ul className="text-sm text-indigo-700 space-y-1">
                  <li>• 記事案は月ごとに管理されます</li>
                  <li>• 「承認」で記事案を確定します</li>
                  <li>• 「編集」でタイトルや概要を変更できます</li>
                </ul>
              </div>
            </div>

            {/* 右側: 記事案一覧 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 min-h-[600px]">
                {isLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-600">読み込み中...</p>
                  </div>
                ) : generateMutation.isPending ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-600">記事案を生成しています...</p>
                  </div>
                ) : (
                  <NoteIdeasList
                    ideas={ideas}
                    onApprove={handleApprove}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    updatingIdeaId={updatingIdeaId}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
