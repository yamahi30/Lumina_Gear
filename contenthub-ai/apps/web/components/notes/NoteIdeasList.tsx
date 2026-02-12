'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { NoteIdea, NoteType } from '@contenthub/types';
import { NoteIdeaCard } from './NoteIdeaCard';

interface NoteIdeasListProps {
  ideas: NoteIdea[];
  onApprove: (ideaId: string) => void;
  onEdit: (ideaId: string, updates: Partial<NoteIdea>) => void;
  onDelete: (ideaId: string) => void;
  updatingIdeaId?: string;
}

const typeOrder: NoteType[] = [
  'free_no_affiliate',
  'free_with_affiliate',
  'membership',
  'paid',
];

const typeLabels: Record<NoteType, string> = {
  free_no_affiliate: '無料記事（アフィなし）',
  free_with_affiliate: '無料記事（アフィあり）',
  membership: 'メンバーシップ記事',
  paid: '有料記事',
};

export function NoteIdeasList({
  ideas,
  onApprove,
  onEdit,
  onDelete,
  updatingIdeaId,
}: NoteIdeasListProps) {
  const [expandedTypes, setExpandedTypes] = useState<Set<NoteType>>(
    new Set(typeOrder)
  );

  const toggleType = (type: NoteType) => {
    const newSet = new Set(expandedTypes);
    if (newSet.has(type)) {
      newSet.delete(type);
    } else {
      newSet.add(type);
    }
    setExpandedTypes(newSet);
  };

  // タイプごとにグループ化
  const groupedIdeas = ideas.reduce(
    (acc, idea) => {
      if (!acc[idea.type]) {
        acc[idea.type] = [];
      }
      acc[idea.type].push(idea);
      return acc;
    },
    {} as Record<NoteType, NoteIdea[]>
  );

  // 日付順にソート
  Object.values(groupedIdeas).forEach((group) => {
    group.sort((a, b) => a.publish_date.localeCompare(b.publish_date));
  });

  const totalCount = ideas.length;
  const approvedCount = ideas.filter((i) => i.status === 'approved').length;

  if (ideas.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>記事案がありません</p>
        <p className="text-sm mt-1">設定を入力して「記事案を生成」を押してください</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          記事案一覧
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({approvedCount}/{totalCount}件 承認済)
          </span>
        </h3>
      </div>

      {typeOrder.map((type) => {
        const typeIdeas = groupedIdeas[type];
        if (!typeIdeas || typeIdeas.length === 0) return null;

        const typeApprovedCount = typeIdeas.filter(
          (i) => i.status === 'approved'
        ).length;

        return (
          <div
            key={type}
            className="border border-gray-200 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => toggleType(type)}
              className="w-full flex items-center justify-between px-4 py-3 bg-gray-50
                hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-900">
                  {typeLabels[type]}
                </span>
                <span className="text-sm text-gray-500">
                  ({typeApprovedCount}/{typeIdeas.length}件)
                </span>
              </div>
              {expandedTypes.has(type) ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </button>

            {expandedTypes.has(type) && (
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {typeIdeas.map((idea) => (
                  <NoteIdeaCard
                    key={idea.id}
                    idea={idea}
                    onApprove={() => onApprove(idea.id)}
                    onEdit={(updates) => onEdit(idea.id, updates)}
                    onDelete={() => onDelete(idea.id)}
                    isUpdating={updatingIdeaId === idea.id}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
