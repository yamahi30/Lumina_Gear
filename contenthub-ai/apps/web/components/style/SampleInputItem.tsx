'use client';

import { Trash2 } from 'lucide-react';

interface SampleInputItemProps {
  index: number;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}

export function SampleInputItem({
  index,
  value,
  onChange,
  onRemove,
  canRemove,
}: SampleInputItemProps) {
  return (
    <div className="relative group">
      <div className="flex items-start gap-2">
        <span className="mt-3 text-xs font-medium text-gray-400 w-6">
          {index + 1}.
        </span>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="過去の投稿サンプルを入力..."
          rows={3}
          className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl resize-none
            focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 transition-all"
        />
        {canRemove && (
          <button
            onClick={onRemove}
            className="mt-2 p-1.5 rounded-lg text-gray-400 hover:text-red-500
              hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100"
            title="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
      {value && (
        <p className="text-xs text-gray-400 mt-1 ml-8">
          {value.length}文字
        </p>
      )}
    </div>
  );
}
