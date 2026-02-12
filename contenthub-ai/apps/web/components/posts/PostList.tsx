'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { GeneratedPost, PostCategory } from '@contenthub/types';
import { PostCard } from './PostCard';

interface PostListProps {
  posts: Record<string, GeneratedPost[]>;
  platform: 'x' | 'threads';
  onSave: (post: GeneratedPost) => void;
  onMarkPosted: (post: GeneratedPost) => void;
  onDelete: (postId: string) => void;
  savingPostId?: string;
  markingPostId?: string;
}

export function PostList({
  posts,
  platform,
  onSave,
  onMarkPosted,
  onDelete,
  savingPostId,
  markingPostId,
}: PostListProps) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(Object.keys(posts))
  );

  const toggleCategory = (category: string) => {
    const newSet = new Set(expandedCategories);
    if (newSet.has(category)) {
      newSet.delete(category);
    } else {
      newSet.add(category);
    }
    setExpandedCategories(newSet);
  };

  const categories = Object.keys(posts);
  const totalCount = Object.values(posts).reduce((sum, arr) => sum + arr.length, 0);

  if (categories.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>生成された投稿がありません</p>
        <p className="text-sm mt-1">条件を入力して「投稿を生成」を押してください</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">
          生成結果
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({totalCount}件)
          </span>
        </h3>
      </div>

      {categories.map((category) => (
        <div key={category} className="border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => toggleCategory(category)}
            className="w-full flex items-center justify-between px-4 py-3 bg-gray-50
              hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">{category}</span>
              <span className="text-sm text-gray-500">
                ({posts[category].length}件)
              </span>
            </div>
            {expandedCategories.has(category) ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </button>

          {expandedCategories.has(category) && (
            <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {posts[category].map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  platform={platform}
                  onSave={() => onSave(post)}
                  onMarkPosted={() => onMarkPosted(post)}
                  onDelete={() => onDelete(post.id)}
                  isSaving={savingPostId === post.id}
                  isMarking={markingPostId === post.id}
                />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
