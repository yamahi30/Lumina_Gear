'use client';

import { useState } from 'react';
import { Plus, Trash2, Sparkles, Loader2 } from 'lucide-react';
import type { PostCondition, PostCategory } from '@contenthub/types';
import { POST_CATEGORIES } from '@contenthub/constants';

interface ConditionFormProps {
  conditions: PostCondition[];
  onConditionsChange: (conditions: PostCondition[]) => void;
  onGenerate: () => void;
  isGenerating: boolean;
  countPerCondition: number;
  onCountChange: (count: number) => void;
}

const emptyCondition: PostCondition = {
  category: 'HSP共感',
  content_idea: '',
  purpose: '',
  hashtags: '',
};

export function ConditionForm({
  conditions,
  onConditionsChange,
  onGenerate,
  isGenerating,
  countPerCondition,
  onCountChange,
}: ConditionFormProps) {
  const handleConditionChange = (index: number, field: keyof PostCondition, value: string) => {
    const newConditions = [...conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    onConditionsChange(newConditions);
  };

  const handleAddCondition = () => {
    if (conditions.length < 5) {
      onConditionsChange([...conditions, { ...emptyCondition }]);
    }
  };

  const handleRemoveCondition = (index: number) => {
    if (conditions.length > 1) {
      onConditionsChange(conditions.filter((_, i) => i !== index));
    }
  };

  const isValid = conditions.every((c) => c.content_idea.trim());

  return (
    <div className="space-y-4">
      {conditions.map((condition, index) => (
        <div
          key={index}
          className="bg-gray-50 rounded-xl p-4 space-y-3 relative group"
        >
          {conditions.length > 1 && (
            <button
              onClick={() => handleRemoveCondition(index)}
              className="absolute top-3 right-3 p-1.5 rounded-lg text-gray-400
                hover:text-red-500 hover:bg-red-50 transition-colors
                opacity-0 group-hover:opacity-100"
              title="削除"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">
              {index + 1}
            </span>
            条件 {index + 1}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                カテゴリ
              </label>
              <select
                value={condition.category}
                onChange={(e) => handleConditionChange(index, 'category', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                  focus:border-indigo-300 focus:ring focus:ring-indigo-200/50"
              >
                {POST_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                目的
              </label>
              <input
                type="text"
                value={condition.purpose}
                onChange={(e) => handleConditionChange(index, 'purpose', e.target.value)}
                placeholder="共感形成、NOTE誘導など"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                  focus:border-indigo-300 focus:ring focus:ring-indigo-200/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              発信内容 <span className="text-red-400">*</span>
            </label>
            <textarea
              value={condition.content_idea}
              onChange={(e) => handleConditionChange(index, 'content_idea', e.target.value)}
              placeholder="投稿の内容・テーマを入力..."
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none
                focus:border-indigo-300 focus:ring focus:ring-indigo-200/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">
              ハッシュタグ
            </label>
            <input
              type="text"
              value={condition.hashtags}
              onChange={(e) => handleConditionChange(index, 'hashtags', e.target.value)}
              placeholder="#HSP #AI活用 #繊細さん"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm
                focus:border-indigo-300 focus:ring focus:ring-indigo-200/50"
            />
          </div>
        </div>
      ))}

      {conditions.length < 5 && (
        <button
          onClick={handleAddCondition}
          className="flex items-center gap-2 px-4 py-2 text-sm text-indigo-600
            hover:bg-indigo-50 rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" />
          条件を追加
        </button>
      )}

      <div className="flex items-center gap-4 pt-2 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">1条件あたり</label>
          <select
            value={countPerCondition}
            onChange={(e) => onCountChange(Number(e.target.value))}
            className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
          >
            {[5, 10, 20, 30].map((n) => (
              <option key={n} value={n}>{n}個</option>
            ))}
          </select>
          <span className="text-sm text-gray-600">生成</span>
        </div>

        <button
          onClick={onGenerate}
          disabled={!isValid || isGenerating}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5
            bg-indigo-500 text-white rounded-xl text-sm font-medium
            hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              生成中...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              投稿を生成
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500">
        合計 {conditions.length * countPerCondition} 個の投稿を生成します
      </p>
    </div>
  );
}
