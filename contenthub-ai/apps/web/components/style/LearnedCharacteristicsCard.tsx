'use client';

import { Sparkles, Clock, Type, Layout } from 'lucide-react';
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
          文体・構造の特徴がここに表示されます
        </p>
      </div>
    );
  }

  // 構造情報があるかチェック
  const hasStructure = characteristics.intro_patterns ||
    characteristics.body_structure ||
    characteristics.closing_patterns ||
    characteristics.heading_style ||
    characteristics.transition_phrases;

  return (
    <div className="space-y-4">
      {/* 文体特性 */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl p-5 border border-indigo-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-indigo-700">
            <Type className="w-5 h-5" />
            <span className="text-sm font-medium">文体特性</span>
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

      {/* 構造特性 */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-5 border border-emerald-100">
        <div className="flex items-center gap-2 text-emerald-700 mb-4">
          <Layout className="w-5 h-5" />
          <span className="text-sm font-medium">構造特性</span>
        </div>

        {hasStructure ? (
          <div className="space-y-4">
            {characteristics.intro_patterns && characteristics.intro_patterns.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">導入パターン</p>
                <div className="flex flex-wrap gap-1">
                  {characteristics.intro_patterns.map((pattern, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-white rounded-md text-xs text-gray-700 border border-gray-200"
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {characteristics.body_structure && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">本文構成</p>
                <p className="text-sm text-gray-800">{characteristics.body_structure}</p>
              </div>
            )}

            {characteristics.heading_style && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">見出しスタイル</p>
                <p className="text-sm text-gray-800">{characteristics.heading_style}</p>
              </div>
            )}

            {characteristics.transition_phrases && characteristics.transition_phrases.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">繋ぎ言葉</p>
                <div className="flex flex-wrap gap-1">
                  {characteristics.transition_phrases.map((phrase, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-emerald-100 rounded-md text-xs text-emerald-700"
                    >
                      {phrase}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {characteristics.closing_patterns && characteristics.closing_patterns.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">締めくくりパターン</p>
                <div className="flex flex-wrap gap-1">
                  {characteristics.closing_patterns.map((pattern, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 bg-white rounded-md text-xs text-gray-700 border border-gray-200"
                    >
                      {pattern}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-2">
            構造特性はまだ分析されていません
          </p>
        )}
      </div>
    </div>
  );
}
