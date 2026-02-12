'use client';

import { Sparkles } from 'lucide-react';
import type { NoteFrequencySettings } from '@/hooks/api/useNotes';

interface FrequencySettingsFormProps {
  settings: NoteFrequencySettings;
  onSettingsChange: (settings: NoteFrequencySettings) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function FrequencySettingsForm({
  settings,
  onSettingsChange,
  onGenerate,
  isGenerating,
}: FrequencySettingsFormProps) {
  const handleChange = (
    key: keyof NoteFrequencySettings,
    value: number
  ) => {
    onSettingsChange({
      ...settings,
      [key]: Math.max(0, Math.min(10, value)),
    });
  };

  const totalCount =
    settings.note_free_no_affiliate_per_month +
    settings.note_free_with_affiliate_per_month +
    settings.note_membership_per_month +
    settings.note_paid_per_month;

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            無料記事（アフィなし）
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={10}
              value={settings.note_free_no_affiliate_per_month}
              onChange={(e) =>
                handleChange(
                  'note_free_no_affiliate_per_month',
                  parseInt(e.target.value) || 0
                )
              }
              className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <span className="text-sm text-gray-500">本/月</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            無料記事（アフィあり）
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={10}
              value={settings.note_free_with_affiliate_per_month}
              onChange={(e) =>
                handleChange(
                  'note_free_with_affiliate_per_month',
                  parseInt(e.target.value) || 0
                )
              }
              className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <span className="text-sm text-gray-500">本/月</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メンバーシップ記事
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={10}
              value={settings.note_membership_per_month}
              onChange={(e) =>
                handleChange(
                  'note_membership_per_month',
                  parseInt(e.target.value) || 0
                )
              }
              className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <span className="text-sm text-gray-500">本/月</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            有料記事
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              max={10}
              value={settings.note_paid_per_month}
              onChange={(e) =>
                handleChange('note_paid_per_month', parseInt(e.target.value) || 0)
              }
              className="w-20 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <span className="text-sm text-gray-500">本/月</span>
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-gray-100">
        <p className="text-sm text-gray-600 mb-3">
          合計: <span className="font-medium">{totalCount}本/月</span>
        </p>
        <button
          onClick={onGenerate}
          disabled={isGenerating || totalCount === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5
            bg-indigo-500 text-white rounded-xl font-medium
            hover:bg-indigo-600 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              記事案を生成
            </>
          )}
        </button>
      </div>
    </div>
  );
}
