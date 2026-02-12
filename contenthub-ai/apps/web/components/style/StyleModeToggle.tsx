'use client';

import { MessageCircle, BookOpen } from 'lucide-react';

export type StyleMode = 'chat' | 'sample';

interface StyleModeToggleProps {
  mode: StyleMode;
  onModeChange: (mode: StyleMode) => void;
}

export function StyleModeToggle({ mode, onModeChange }: StyleModeToggleProps) {
  return (
    <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
      <button
        onClick={() => onModeChange('chat')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
          ${
            mode === 'chat'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }
        `}
      >
        <MessageCircle className="w-4 h-4" />
        AIチャット
      </button>
      <button
        onClick={() => onModeChange('sample')}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all
          ${
            mode === 'sample'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }
        `}
      >
        <BookOpen className="w-4 h-4" />
        サンプル学習
      </button>
    </div>
  );
}
