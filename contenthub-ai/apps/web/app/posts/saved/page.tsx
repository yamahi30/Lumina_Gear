'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Inbox } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PlatformToggle } from '@/components/posts';
import { SavedPostCard } from '@/components/posts/SavedPostCard';
import {
  useSavedPosts,
  useDeleteSavedPost,
  useMarkPosted,
  type PostPlatform,
} from '@/hooks/api/usePosts';

export default function SavedPostsPage() {
  const [platform, setPlatform] = useState<PostPlatform>('x');
  const [deletingId, setDeletingId] = useState<string>();
  const [markingId, setMarkingId] = useState<string>();

  const { data: savedPosts, isLoading } = useSavedPosts(platform);
  const deleteMutation = useDeleteSavedPost();
  const markPostedMutation = useMarkPosted();

  const handleDelete = async (postId: string) => {
    setDeletingId(postId);
    try {
      await deleteMutation.mutateAsync({ platform, postId });
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeletingId(undefined);
    }
  };

  const handleMarkPosted = async (post: typeof savedPosts extends (infer T)[] | undefined ? T : never) => {
    if (!post) return;
    setMarkingId(post.id);
    try {
      await markPostedMutation.mutateAsync({ platform, post });
      // 投稿済みにしたら保存ボックスからも削除
      await deleteMutation.mutateAsync({ platform, postId: post.id });
    } catch (error) {
      console.error('Mark posted failed:', error);
    } finally {
      setMarkingId(undefined);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link
              href="/posts"
              className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              投稿作成に戻る
            </Link>
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              保存ボックス
            </h1>
            <p className="text-sm text-gray-600">
              保存した投稿を管理できます
            </p>
          </div>

          {/* プラットフォーム選択 */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 mb-6">
            <PlatformToggle
              platform={platform}
              onPlatformChange={setPlatform}
            />
          </div>

          {/* 投稿一覧 */}
          <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : savedPosts && savedPosts.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold text-gray-900">
                    {platform === 'x' ? 'X' : 'Threads'}の保存済み投稿
                    <span className="ml-2 text-sm font-normal text-gray-500">
                      ({savedPosts.length}件)
                    </span>
                  </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {savedPosts.map((post) => (
                    <SavedPostCard
                      key={post.id}
                      post={post}
                      platform={platform}
                      onDelete={() => handleDelete(post.id)}
                      onMarkPosted={() => handleMarkPosted(post)}
                      isDeleting={deletingId === post.id}
                      isMarking={markingId === post.id}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <Inbox className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-600 mb-2">
                  保存した投稿がありません
                </p>
                <p className="text-sm text-gray-500">
                  投稿作成ページで「保存」ボタンを押すと、ここに追加されます
                </p>
                <Link
                  href="/posts"
                  className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors"
                >
                  投稿を作成する
                </Link>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
