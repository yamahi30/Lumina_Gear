'use client';

import { useState, useEffect } from 'react';
import { Save, Sparkles, Loader2, ArrowRight } from 'lucide-react';
import type { StyleType, StyleGuideType } from '@contenthub/types';
import { StyleTypeSelector } from './StyleTypeSelector';
import { SampleInputList } from './SampleInputList';
import { LearnedCharacteristicsCard } from './LearnedCharacteristicsCard';
import {
  useStyleLearningData,
  useSaveStyleSamples,
  useLearnStyle,
  useStyleGuide,
  useUpdateStyleGuide,
} from '@/hooks/api/useStyleLearning';

// 学習特性をスタイルガイド用にフォーマット
function formatCharacteristicsForGuide(characteristics: {
  tone?: string;
  sentence_endings?: string[];
  emoji_usage?: string;
  paragraph_style?: string;
  keywords?: string[];
  intro_patterns?: string[];
  body_structure?: string;
  closing_patterns?: string[];
  heading_style?: string;
  transition_phrases?: string[];
}): string {
  let text = '## 学習済み文体特性\n\n';
  text += `（自動生成: ${new Date().toLocaleString('ja-JP')}）\n\n`;

  if (characteristics.tone) {
    text += `### トーン\n${characteristics.tone}\n\n`;
  }
  if (characteristics.sentence_endings && characteristics.sentence_endings.length > 0) {
    text += `### 語尾パターン\n${characteristics.sentence_endings.map(e => `- ${e}`).join('\n')}\n\n`;
  }
  if (characteristics.emoji_usage) {
    text += `### 絵文字の使い方\n${characteristics.emoji_usage}\n\n`;
  }
  if (characteristics.paragraph_style) {
    text += `### 段落スタイル\n${characteristics.paragraph_style}\n\n`;
  }
  if (characteristics.keywords && characteristics.keywords.length > 0) {
    text += `### よく使うキーワード\n${characteristics.keywords.map(k => `- ${k}`).join('\n')}\n\n`;
  }
  if (characteristics.intro_patterns && characteristics.intro_patterns.length > 0) {
    text += `### 導入パターン\n${characteristics.intro_patterns.map(p => `- ${p}`).join('\n')}\n\n`;
  }
  if (characteristics.body_structure) {
    text += `### 本文構成\n${characteristics.body_structure}\n\n`;
  }
  if (characteristics.closing_patterns && characteristics.closing_patterns.length > 0) {
    text += `### 締めくくりパターン\n${characteristics.closing_patterns.map(p => `- ${p}`).join('\n')}\n\n`;
  }
  if (characteristics.heading_style) {
    text += `### 見出しスタイル\n${characteristics.heading_style}\n\n`;
  }
  if (characteristics.transition_phrases && characteristics.transition_phrases.length > 0) {
    text += `### 繋ぎ言葉\n${characteristics.transition_phrases.map(p => `- ${p}`).join('\n')}\n\n`;
  }

  text += '## ---\n';
  return text;
}

// StyleType → StyleGuideType マッピング
const styleTypeToGuideType: Record<StyleType, StyleGuideType> = {
  x_style: 'x',
  threads_style: 'threads',
  note_free: 'note_free',
  note_affiliate: 'note_affiliate',
  note_membership: 'note_membership',
  note_paid: 'note_paid',
};

export function SampleLearningPanel() {
  const [selectedType, setSelectedType] = useState<StyleType>('x_style');
  const [samples, setSamples] = useState<string[]>(['']);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);

  // データ取得
  const { data: learningData, isLoading: isLoadingData } = useStyleLearningData(selectedType);

  // スタイルガイドを取得（反映のため）
  const guideType = styleTypeToGuideType[selectedType];
  const { data: styleGuide } = useStyleGuide(guideType);
  const updateGuideMutation = useUpdateStyleGuide();

  // ミューテーション
  const saveMutation = useSaveStyleSamples();
  const learnMutation = useLearnStyle();

  // タイプ変更時にデータをロード
  useEffect(() => {
    if (learningData?.samples && learningData.samples.length > 0) {
      setSamples(learningData.samples);
    } else {
      setSamples(['']);
    }
    setHasUnsavedChanges(false);
  }, [learningData, selectedType]);

  // サンプル変更時に未保存フラグを立てる
  const handleSamplesChange = (newSamples: string[]) => {
    setSamples(newSamples);
    setHasUnsavedChanges(true);
  };

  // タイプ変更
  const handleTypeChange = (type: StyleType) => {
    setSelectedType(type);
  };

  // 保存
  const handleSave = async () => {
    const validSamples = samples.filter((s) => s.trim());
    if (validSamples.length === 0) return;

    try {
      await saveMutation.mutateAsync({
        type: selectedType,
        samples: validSamples,
      });
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  // 分析実行
  const handleLearn = async () => {
    const validSamples = samples.filter((s) => s.trim());
    if (validSamples.length === 0) return;

    try {
      await learnMutation.mutateAsync({
        type: selectedType,
        samples: validSamples,
      });
      setHasUnsavedChanges(false);
      setApplySuccess(false); // 新しい分析後はリセット
    } catch (error) {
      console.error('Learn failed:', error);
    }
  };

  // 分析結果をスタイルガイドに反映
  const handleApply = async () => {
    const characteristics = learningData?.learned_characteristics;
    if (!characteristics) return;

    setIsApplying(true);
    setApplySuccess(false);

    try {
      // 学習特性をフォーマットしてスタイルガイドに追記
      const characteristicsText = formatCharacteristicsForGuide(characteristics);
      const currentContent = styleGuide?.content || '';

      // 既存のコンテンツに学習結果を追記または更新
      let newContent = currentContent;
      const marker = '## 学習済み文体特性';
      const endMarker = '## ---';

      if (currentContent.includes(marker)) {
        // 既存のセクションを置換
        const startIdx = currentContent.indexOf(marker);
        const endIdx = currentContent.indexOf(endMarker, startIdx);
        if (endIdx > startIdx) {
          newContent = currentContent.substring(0, startIdx) +
                       characteristicsText +
                       currentContent.substring(endIdx + endMarker.length);
        } else {
          newContent = currentContent.substring(0, startIdx) + characteristicsText;
        }
      } else {
        // 新規追加
        newContent = currentContent + '\n\n' + characteristicsText;
      }

      await updateGuideMutation.mutateAsync({
        type: guideType,
        content: newContent.trim(),
      });

      setApplySuccess(true);
    } catch (error) {
      console.error('Apply failed:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const validSamplesCount = samples.filter((s) => s.trim()).length;
  const canSave = validSamplesCount > 0 && !saveMutation.isPending;
  const canLearn = validSamplesCount > 0 && !learnMutation.isPending;
  const canApply = learningData?.learned_characteristics && !isApplying;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 左側: サンプル入力 */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">サンプル投稿を登録</h2>
          <p className="text-xs text-gray-500 mt-1">
            過去の投稿をサンプルとして登録し、文体・構造を分析します
          </p>
        </div>

        <div className="p-5 space-y-5">
          {/* スタイルタイプ選択 */}
          <StyleTypeSelector
            selectedType={selectedType}
            onTypeChange={handleTypeChange}
          />

          {/* ローディング */}
          {isLoadingData ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* サンプル入力リスト */}
              <SampleInputList
                samples={samples}
                onChange={handleSamplesChange}
              />

              {/* アクションボタン */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={!canSave}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                    bg-gray-100 text-gray-700 rounded-xl text-sm font-medium
                    hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  保存のみ
                </button>

                <button
                  onClick={handleLearn}
                  disabled={!canLearn}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
                    bg-indigo-500 text-white rounded-xl text-sm font-medium
                    hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors"
                >
                  {learnMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  分析実行
                </button>
              </div>

              {hasUnsavedChanges && (
                <p className="text-xs text-amber-600">
                  未保存の変更があります
                </p>
              )}

              {saveMutation.isSuccess && !hasUnsavedChanges && (
                <p className="text-xs text-green-600">
                  保存しました
                </p>
              )}

              {(saveMutation.isError || learnMutation.isError) && (
                <p className="text-xs text-red-600">
                  エラーが発生しました
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* 右側: 分析結果表示 */}
      <div className="space-y-4">
        <LearnedCharacteristicsCard
          characteristics={learningData?.learned_characteristics || null}
          updatedAt={learningData?.updated_at}
          isLoading={learnMutation.isPending}
        />

        {/* 反映ボタン */}
        {learningData?.learned_characteristics && (
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-4">
            <button
              onClick={handleApply}
              disabled={!canApply}
              className="w-full flex items-center justify-center gap-2 px-4 py-3
                bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl
                text-sm font-medium shadow-sm
                hover:from-green-600 hover:to-emerald-600
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all"
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  反映中...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  スタイルガイドに反映
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 text-center mt-2">
              分析結果を文体構造ガイドに追記します
            </p>
            {applySuccess && (
              <p className="text-xs text-green-600 text-center mt-2">
                スタイルガイドに反映しました
              </p>
            )}
            {updateGuideMutation.isError && (
              <p className="text-xs text-red-600 text-center mt-2">
                反映に失敗しました
              </p>
            )}
          </div>
        )}

        {/* ヒント */}
        <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
          <h3 className="text-sm font-medium text-indigo-800 mb-2">
            効果的な学習のコツ
          </h3>
          <ul className="text-sm text-indigo-700 space-y-1">
            <li>• 3〜5個以上のサンプルを登録するとより正確に分析できます</li>
            <li>• 似たテイストの投稿を集めると、一貫した文体・構造を学習できます</li>
            <li>• 反応の良かった投稿を優先的に登録するのがおすすめです</li>
            <li>• NOTE記事は導入〜本文〜締めくくりの構造も分析されます</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
