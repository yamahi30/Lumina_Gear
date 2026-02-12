'use client';

import { useState, useEffect } from 'react';
import { Save, Sparkles, Loader2 } from 'lucide-react';
import type { StyleType } from '@contenthub/types';
import { StyleTypeSelector } from './StyleTypeSelector';
import { SampleInputList } from './SampleInputList';
import { LearnedCharacteristicsCard } from './LearnedCharacteristicsCard';
import {
  useStyleLearningData,
  useSaveStyleSamples,
  useLearnStyle,
} from '@/hooks/api/useStyleLearning';

export function SampleLearningPanel() {
  const [selectedType, setSelectedType] = useState<StyleType>('x_style');
  const [samples, setSamples] = useState<string[]>(['']);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // データ取得
  const { data: learningData, isLoading: isLoadingData } = useStyleLearningData(selectedType);

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
    } catch (error) {
      console.error('Learn failed:', error);
    }
  };

  const validSamplesCount = samples.filter((s) => s.trim()).length;
  const canSave = validSamplesCount > 0 && !saveMutation.isPending;
  const canLearn = validSamplesCount > 0 && !learnMutation.isPending;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 左側: サンプル入力 */}
      <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">サンプル投稿を登録</h2>
          <p className="text-xs text-gray-500 mt-1">
            過去の投稿をサンプルとして登録し、文体を分析します
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

        {/* ヒント */}
        <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
          <h3 className="text-sm font-medium text-indigo-800 mb-2">
            効果的な学習のコツ
          </h3>
          <ul className="text-sm text-indigo-700 space-y-1">
            <li>• 3〜5個以上のサンプルを登録するとより正確に分析できます</li>
            <li>• 似たテイストの投稿を集めると、一貫した文体を学習できます</li>
            <li>• 反応の良かった投稿を優先的に登録するのがおすすめです</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
