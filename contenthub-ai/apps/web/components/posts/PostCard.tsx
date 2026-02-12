'use client';

import { useState } from 'react';
import { Copy, Check, Bookmark, CheckCircle, Trash2, MoreHorizontal } from 'lucide-react';
import type { GeneratedPost } from '@contenthub/types';

interface PostCardProps {
  post: GeneratedPost;
  platform: 'x' | 'threads';
  onSave: () => void;
  onMarkPosted: () => void;
  onDelete: () => void;
  isSaving?: boolean;
  isMarking?: boolean;
}

export function PostCard({
  post,
  platform,
  onSave,
  onMarkPosted,
  onDelete,
  isSaving,
  isMarking,
}: PostCardProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const maxLength = platform === 'x' ? 140 : 500;
  const isOverLimit = post.character_count > maxLength;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(post.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">
          {post.category}
        </span>
        <div className="flex items-center gap-1">
          <span className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-400'}`}>
            {post.character_count}/{maxLength}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 min-w-[120px]">
                  <button
                    onClick={() => {
                      onDelete();
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    削除
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-800 whitespace-pre-wrap mb-3 leading-relaxed">
        {post.content}
      </p>

      {post.hashtags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {post.hashtags.map((tag, i) => (
            <span key={i} className="text-xs text-indigo-600">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
            bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-500" />
              コピー済
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              コピー
            </>
          )}
        </button>

        <button
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
            bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors
            disabled:opacity-50"
        >
          <Bookmark className="w-3.5 h-3.5" />
          {isSaving ? '保存中...' : '保存'}
        </button>

        <button
          onClick={onMarkPosted}
          disabled={isMarking}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
            bg-green-50 text-green-700 hover:bg-green-100 transition-colors
            disabled:opacity-50"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {isMarking ? '処理中...' : '投稿済み'}
        </button>
      </div>
    </div>
  );
}
