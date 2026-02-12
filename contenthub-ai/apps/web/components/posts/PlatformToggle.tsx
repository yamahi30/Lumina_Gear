'use client';

import type { PostPlatform } from '@/hooks/api/usePosts';

interface PlatformToggleProps {
  platform: PostPlatform;
  onPlatformChange: (platform: PostPlatform) => void;
}

const PLATFORMS: { value: PostPlatform; label: string; description: string; charLimit: number }[] = [
  { value: 'x', label: 'X', description: '140字のつぶやき', charLimit: 140 },
  { value: 'threads', label: 'Threads', description: '500字の日記形式', charLimit: 500 },
];

export function PlatformToggle({ platform, onPlatformChange }: PlatformToggleProps) {
  return (
    <div className="flex gap-3">
      {PLATFORMS.map((p) => (
        <button
          key={p.value}
          onClick={() => onPlatformChange(p.value)}
          className={`
            flex-1 px-4 py-3 rounded-xl text-left transition-all
            ${
              platform === p.value
                ? 'bg-indigo-500 text-white shadow-md'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300'
            }
          `}
        >
          <div className="font-semibold">{p.label}</div>
          <div className={`text-xs ${platform === p.value ? 'text-indigo-100' : 'text-gray-500'}`}>
            {p.description}（{p.charLimit}字）
          </div>
        </button>
      ))}
    </div>
  );
}
