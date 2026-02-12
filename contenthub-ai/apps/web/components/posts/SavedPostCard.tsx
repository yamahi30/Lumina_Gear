'use client';

import { useState } from 'react';
import { Copy, Check, Trash2, CheckCircle, Clock } from 'lucide-react';
import type { SavedPost } from '@contenthub/types';

interface SavedPostCardProps {
  post: SavedPost;
  platform: 'x' | 'threads';
  onDelete: () => void;
  onMarkPosted: () => void;
  isDeleting?: boolean;
  isMarking?: boolean;
}

export function SavedPostCard({
  post,
  platform,
  onDelete,
  onMarkPosted,
  isDeleting,
  isMarking,
}: SavedPostCardProps) {
  const [copied, setCopied] = useState(false);

  const maxLength = platform === 'x' ? 140 : 500;
  const isOverLimit = post.character_count > maxLength;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(post.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ja-JP', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-xs font-medium">
            {post.category}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            {formatDate(post.saved_at)}
          </span>
        </div>
        <span className={`text-xs ${isOverLimit ? 'text-red-500' : 'text-gray-400'}`}>
          {post.character_count}/{maxLength}
        </span>
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
          onClick={onMarkPosted}
          disabled={isMarking}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
            bg-green-50 text-green-700 hover:bg-green-100 transition-colors
            disabled:opacity-50"
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {isMarking ? '処理中...' : '投稿済み'}
        </button>

        <button
          onClick={onDelete}
          disabled={isDeleting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs
            bg-red-50 text-red-600 hover:bg-red-100 transition-colors
            disabled:opacity-50 ml-auto"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {isDeleting ? '削除中...' : '削除'}
        </button>
      </div>
    </div>
  );
}
