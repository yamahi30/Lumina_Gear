'use client';

import type { StyleType } from '@contenthub/types';
import { STYLE_TYPE_LABELS } from '@contenthub/constants';

interface StyleTypeSelectorProps {
  selectedType: StyleType;
  onTypeChange: (type: StyleType) => void;
}

// スタイルタイプのカテゴリ分類
const STYLE_CATEGORIES = [
  {
    category: 'SNS',
    types: ['x_style', 'threads_style'] as StyleType[],
  },
  {
    category: 'NOTE',
    types: ['note_free', 'note_affiliate', 'note_membership', 'note_paid'] as StyleType[],
  },
];

export function StyleTypeSelector({ selectedType, onTypeChange }: StyleTypeSelectorProps) {
  return (
    <div className="space-y-3">
      {STYLE_CATEGORIES.map((category) => (
        <div key={category.category}>
          <p className="text-xs font-medium text-gray-500 mb-2">{category.category}</p>
          <div className="flex flex-wrap gap-2">
            {category.types.map((type) => (
              <button
                key={type}
                onClick={() => onTypeChange(type)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${
                    selectedType === type
                      ? 'bg-indigo-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                {STYLE_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
