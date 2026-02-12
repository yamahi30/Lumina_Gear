'use client';

import { useState } from 'react';
import { Check, RefreshCw, Trash2, Edit2, X } from 'lucide-react';
import type { NoteIdea } from '@contenthub/types';
import { NoteTypeLabel } from './NoteTypeLabel';

interface NoteIdeaCardProps {
  idea: NoteIdea;
  onApprove: () => void;
  onEdit: (updates: Partial<NoteIdea>) => void;
  onDelete: () => void;
  isUpdating?: boolean;
}

export function NoteIdeaCard({
  idea,
  onApprove,
  onEdit,
  onDelete,
  isUpdating,
}: NoteIdeaCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(idea.title);
  const [editSummary, setEditSummary] = useState(idea.summary);

  const handleSaveEdit = () => {
    onEdit({ title: editTitle, summary: editSummary });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(idea.title);
    setEditSummary(idea.summary);
    setIsEditing(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div
      className={`bg-white rounded-xl border p-4 transition-all ${
        idea.status === 'approved'
          ? 'border-green-200 bg-green-50/30'
          : 'border-gray-200 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">
            {formatDate(idea.publish_date)}
          </span>
          <NoteTypeLabel type={idea.type} />
          {idea.status === 'approved' && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-md text-xs">
              <Check className="w-3 h-3" />
              承認済
            </span>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="space-y-3">
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="タイトル"
          />
          <textarea
            value={editSummary}
            onChange={(e) => setEditSummary(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            placeholder="概要"
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveEdit}
              className="px-3 py-1.5 bg-indigo-500 text-white rounded-lg text-xs font-medium hover:bg-indigo-600 transition-colors"
            >
              保存
            </button>
            <button
              onClick={handleCancelEdit}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200 transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <>
          <h3 className="font-medium text-gray-900 mb-2 leading-snug">
            {idea.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
            {idea.summary}
          </p>

          {idea.affiliate_info && (
            <div className="mb-3 px-3 py-2 bg-gray-50 rounded-lg">
              <p className="text-xs text-gray-500 mb-0.5">アフィリエイト</p>
              <p className="text-sm text-gray-700">
                {idea.affiliate_info.category}: {idea.affiliate_info.name}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            {idea.status === 'pending' && (
              <button
                onClick={onApprove}
                disabled={isUpdating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                  bg-green-50 text-green-700 hover:bg-green-100 transition-colors
                  disabled:opacity-50"
              >
                <Check className="w-3.5 h-3.5" />
                {isUpdating ? '処理中...' : '承認'}
              </button>
            )}

            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
              編集
            </button>

            <button
              onClick={onDelete}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
                bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              削除
            </button>
          </div>
        </>
      )}
    </div>
  );
}
