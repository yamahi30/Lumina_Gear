'use client';

import type { NoteType } from '@contenthub/types';

interface NoteTypeLabelProps {
  type: NoteType;
}

const typeConfig: Record<NoteType, { label: string; className: string }> = {
  free_no_affiliate: {
    label: '無料（アフィなし）',
    className: 'bg-blue-50 text-blue-700',
  },
  free_with_affiliate: {
    label: '無料（アフィあり）',
    className: 'bg-green-50 text-green-700',
  },
  membership: {
    label: 'メンバーシップ',
    className: 'bg-purple-50 text-purple-700',
  },
  paid: {
    label: '有料記事',
    className: 'bg-amber-50 text-amber-700',
  },
};

export function NoteTypeLabel({ type }: NoteTypeLabelProps) {
  const config = typeConfig[type];

  return (
    <span
      className={`px-2 py-0.5 rounded-md text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
