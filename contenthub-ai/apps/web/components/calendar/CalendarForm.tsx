'use client';

import { useState } from 'react';
import type { FrequencySettings } from '@contenthub/types';
import { DEFAULT_FREQUENCY_SETTINGS } from '@contenthub/constants';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';

interface CalendarFormProps {
  onSubmit: (startDate: string, settings: FrequencySettings) => void;
  isLoading: boolean;
}

export function CalendarForm({ onSubmit, isLoading }: CalendarFormProps) {
  // 来月の1日をデフォルトに
  const nextMonth = new Date();
  nextMonth.setMonth(nextMonth.getMonth() + 1);
  nextMonth.setDate(1);
  const defaultDate = nextMonth.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(defaultDate);
  const [settings, setSettings] = useState<FrequencySettings>(DEFAULT_FREQUENCY_SETTINGS);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(startDate, settings);
  };

  const updateSetting = (key: keyof FrequencySettings, value: number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>コンテンツカレンダー作成</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 開始日 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              開始日
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

          {/* 投稿頻度設定 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">投稿頻度設定</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FrequencyInput
                label="X (Twitter)"
                value={settings.x_per_day}
                onChange={(v) => updateSetting('x_per_day', v)}
                unit="回/日"
                min={0}
                max={10}
              />
              <FrequencyInput
                label="Threads"
                value={settings.threads_per_day}
                onChange={(v) => updateSetting('threads_per_day', v)}
                unit="回/日"
                min={0}
                max={10}
              />
              <FrequencyInput
                label="NOTE無料（アフィなし）"
                value={settings.note_free_no_affiliate_per_month}
                onChange={(v) => updateSetting('note_free_no_affiliate_per_month', v)}
                unit="本/月"
                min={0}
                max={30}
              />
              <FrequencyInput
                label="NOTE無料（アフィあり）"
                value={settings.note_free_with_affiliate_per_month}
                onChange={(v) => updateSetting('note_free_with_affiliate_per_month', v)}
                unit="本/月"
                min={0}
                max={30}
              />
              <FrequencyInput
                label="NOTEメンバーシップ"
                value={settings.note_membership_per_month}
                onChange={(v) => updateSetting('note_membership_per_month', v)}
                unit="本/月"
                min={0}
                max={30}
              />
              <FrequencyInput
                label="NOTE有料"
                value={settings.note_paid_per_month}
                onChange={(v) => updateSetting('note_paid_per_month', v)}
                unit="本/月"
                min={0}
                max={10}
              />
            </div>
          </div>

          {/* 生成ボタン */}
          <Button type="submit" className="w-full" isLoading={isLoading}>
            カレンダーを生成
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

interface FrequencyInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit: string;
  min: number;
  max: number;
}

function FrequencyInput({
  label,
  value,
  onChange,
  unit,
  min,
  max,
}: FrequencyInputProps) {
  return (
    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50">
      <label className="text-sm text-gray-700">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => onChange(parseInt(e.target.value) || 0)}
          min={min}
          max={max}
          className="w-16 px-2 py-1 text-center rounded-lg border border-gray-200 bg-white
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <span className="text-xs text-gray-500">{unit}</span>
      </div>
    </div>
  );
}
