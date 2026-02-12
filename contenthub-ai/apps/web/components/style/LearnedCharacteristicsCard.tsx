'use client';

import { Sparkles, Clock } from 'lucide-react';
import type { LearnedCharacteristics } from '@contenthub/types';

interface LearnedCharacteristicsCardProps {
  characteristics: LearnedCharacteristics | null;
  updatedAt?: string;
  isLoading?: boolean;
}

export function LearnedCharacteristicsCard({
  characteristics,
  updatedAt,
  isLoading,
}: LearnedCharacteristicsCardProps) {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-indigo-700">分析中...</span>
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-indigo-100/50 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!characteristics || !characteristics.tone) {
    return (
      <div className="bg-gray-50 rounded-2xl p-5 border border-gray-200">
        <div className="flex items-center gap-2 text-gray-400 mb-3">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-medium">分析結果</span>
        </div>
        <p className="text-sm text-gray-500 text-center py-4">
          サンプルを登録して「分析実行」を押すと、<br />
          文体の特徴がここに表示されます
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-indigo-700">
          <Sparkles className="w-5 h-5" />
          <span className="text-sm font-medium">分析結果</span>
        </div>
        {updatedAt && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="w-3 h-3" />
            {new Date(updatedAt).toLocaleDateString('ja-JP')}
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">トーン</p>
          <p className="text-sm text-gray-800">{characteristics.tone}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">語尾パターン</p>
          <div className="flex flex-wrap gap-1">
            {characteristics.sentence_endings.map((ending, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-white rounded-md text-xs text-gray-700 border border-gray-200"
              >
                {ending}
              </span>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">絵文字</p>
          <p className="text-sm text-gray-800">{characteristics.emoji_usage}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">段落スタイル</p>
          <p className="text-sm text-gray-800">{characteristics.paragraph_style}</p>
        </div>

        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">キーワード</p>
          <div className="flex flex-wrap gap-1">
            {characteristics.keywords.map((keyword, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-indigo-100 rounded-md text-xs text-indigo-700"
              >
                {keyword}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
