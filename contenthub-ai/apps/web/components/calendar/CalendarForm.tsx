'use client';

import { useState } from 'react';
import type { CalendarPlatformType } from '@contenthub/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';

// 媒体タイプの定義
const PLATFORM_OPTIONS: {
  value: CalendarPlatformType;
  label: string;
  description: string;
  unit: string;
  isDaily: boolean;
  defaultFrequency: number;
  maxFrequency: number;
}[] = [
  {
    value: 'x',
    label: 'X (Twitter)',
    description: '1日分の投稿計画を生成',
    unit: '回/日',
    isDaily: true,
    defaultFrequency: 3,
    maxFrequency: 10,
  },
  {
    value: 'threads',
    label: 'Threads',
    description: '1日分の投稿計画を生成',
    unit: '回/日',
    isDaily: true,
    defaultFrequency: 1,
    maxFrequency: 10,
  },
  {
    value: 'note_free_no_affiliate',
    label: 'NOTE無料（アフィなし）',
    description: '月単位で記事計画を生成',
    unit: '本/月',
    isDaily: false,
    defaultFrequency: 4,
    maxFrequency: 30,
  },
  {
    value: 'note_free_with_affiliate',
    label: 'NOTE無料（アフィあり）',
    description: '月単位で記事計画を生成',
    unit: '本/月',
    isDaily: false,
    defaultFrequency: 2,
    maxFrequency: 30,
  },
  {
    value: 'note_membership',
    label: 'NOTEメンバーシップ',
    description: '月単位で記事計画を生成',
    unit: '本/月',
    isDaily: false,
    defaultFrequency: 4,
    maxFrequency: 30,
  },
  {
    value: 'note_paid',
    label: 'NOTE有料',
    description: '月単位で記事計画を生成',
    unit: '本/月',
    isDaily: false,
    defaultFrequency: 1,
    maxFrequency: 10,
  },
];

export interface CalendarGenerateRequest {
  platform: CalendarPlatformType;
  startDate: string;
  frequency: number;
  applyContext: boolean;
}

interface CalendarFormProps {
  onSubmit: (request: CalendarGenerateRequest) => void;
  isLoading: boolean;
}

export function CalendarForm({ onSubmit, isLoading }: CalendarFormProps) {
  // 今日をデフォルトに
  const today = new Date();
  const defaultDate = today.toISOString().split('T')[0];

  const [selectedPlatform, setSelectedPlatform] = useState<CalendarPlatformType>('x');
  const [startDate, setStartDate] = useState(defaultDate);
  const [frequency, setFrequency] = useState(3);
  const [applyContext, setApplyContext] = useState(true);

  // 選択された媒体の情報
  const platformInfo = PLATFORM_OPTIONS.find((p) => p.value === selectedPlatform)!;

  // 媒体変更時に頻度をデフォルトに
  const handlePlatformChange = (platform: CalendarPlatformType) => {
    setSelectedPlatform(platform);
    const info = PLATFORM_OPTIONS.find((p) => p.value === platform);
    if (info) {
      setFrequency(info.defaultFrequency);
    }
  };

  // 生成ハンドラー
  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      platform: selectedPlatform,
      startDate,
      frequency,
      applyContext,
    });
  };

  // 日付のフォーマット（表示用）
  const formatDateLabel = (dateStr: string) => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const dayOfWeek = dayNames[date.getDay()];
    return `${month}/${day}（${dayOfWeek}）`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>コンテンツカレンダー作成</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGenerate} className="space-y-6">
          {/* 媒体選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              媒体を選択
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {PLATFORM_OPTIONS.map((platform) => (
                <button
                  key={platform.value}
                  type="button"
                  onClick={() => handlePlatformChange(platform.value)}
                  className={`
                    p-3 rounded-xl text-left transition-all border-2
                    ${selectedPlatform === platform.value
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                    }
                  `}
                >
                  <span className={`text-sm font-medium ${
                    selectedPlatform === platform.value ? 'text-indigo-700' : 'text-gray-900'
                  }`}>
                    {platform.label}
                  </span>
                  <p className={`text-xs mt-0.5 ${
                    selectedPlatform === platform.value ? 'text-indigo-600' : 'text-gray-500'
                  }`}>
                    {platform.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* 日付選択 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {platformInfo.isDaily ? '開始日' : '対象月'}
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-200 bg-white/80
                         focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                         transition-all"
              required
            />
          </div>

          {/* 投稿頻度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              投稿頻度
            </label>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
              <span className="text-sm text-gray-700 flex-1">{platformInfo.label}</span>
              <input
                type="number"
                value={frequency}
                onChange={(e) => setFrequency(Math.max(1, Math.min(platformInfo.maxFrequency, parseInt(e.target.value) || 1)))}
                min={1}
                max={platformInfo.maxFrequency}
                className="w-20 px-3 py-2 text-center rounded-lg border border-gray-200 bg-white
                           focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500 w-12">{platformInfo.unit}</span>
            </div>
          </div>

          {/* 生成オプション */}
          <div>
            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-gray-50/50 hover:bg-gray-100/50 transition-colors">
              <input
                type="checkbox"
                checked={applyContext}
                onChange={(e) => setApplyContext(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="text-sm font-medium text-gray-700">コンテキストを適用</span>
                <p className="text-xs text-gray-500">設定画面で入力した市場調査・競合分析・カスタム指示を反映します</p>
              </div>
            </label>
          </div>

          {/* 生成ボタン */}
          <Button type="submit" className="w-full" isLoading={isLoading}>
            {platformInfo.isDaily
              ? `${formatDateLabel(startDate)}の${frequency}件を生成`
              : `${frequency}本分のカレンダーを生成`
            }
          </Button>

          {/* ヒント */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
            <p className="text-xs text-amber-800">
              {platformInfo.isDaily
                ? '1日単位で生成することで、AIの処理負荷を軽減し、より質の高い提案が得られます。'
                : 'NOTE記事は月単位でまとめて計画を立てます。'
              }
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
