'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Inbox } from 'lucide-react';
import type { PostCondition, GeneratedPost } from '@contenthub/types';
import { Header } from '@/components/shared/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PlatformToggle, ConditionForm, PostList } from '@/components/posts';
import {
  useGeneratePosts,
  useSavePost,
  useMarkPosted,
  useDeletePost,
  type PostPlatform,
} from '@/hooks/api/usePosts';

const defaultCondition: PostCondition = {
  category: 'HSP共感',
  content_idea: '',
  purpose: '',
  hashtags: '#HSP #繊細さん',
};

const STORAGE_KEY = 'contenthub_generated_posts';

export default function PostsPage() {
  const [platform, setPlatform] = useState<PostPlatform>('x');
  const [conditions, setConditions] = useState<PostCondition[]>([{ ...defaultCondition }]);
  const [countPerCondition, setCountPerCondition] = useState(10);
  const [generatedPosts, setGeneratedPosts] = useState<Record<string, GeneratedPost[]>>({});
  const [savingPostId, setSavingPostId] = useState<string>();
  const [markingPostId, setMarkingPostId] = useState<string>();
  const [isInitialized, setIsInitialized] = useState(false);

  // sessionStorageから復元
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setGeneratedPosts(parsed.posts || {});
        if (parsed.platform) {
          setPlatform(parsed.platform);
        }
      }
    } catch {
      // ignore
    }
    setIsInitialized(true);
  }, []);

  // sessionStorageに保存
  useEffect(() => {
    if (isInitialized) {
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
          posts: generatedPosts,
          platform,
        }));
      } catch {
        // ignore
      }
    }
  }, [generatedPosts, platform, isInitialized]);

  const generateMutation = useGeneratePosts();
  const saveMutation = useSavePost();
  const markPostedMutation = useMarkPosted();
  const deleteMutation = useDeletePost();

  const handleGenerate = async () => {
    try {
      const result = await generateMutation.mutateAsync({
        platform,
        conditions,
        countPerCondition,
      });
      if (result) {
        setGeneratedPosts(result);
      }
    } catch (error) {
      console.error('Generation failed:', error);
    }
  };

  const handleSave = async (post: GeneratedPost) => {
    setSavingPostId(post.id);
    try {
      await saveMutation.mutateAsync({ platform, post });
      // 保存したら一覧から削除
      setGeneratedPosts((prev) => {
        const newPosts = { ...prev };
        for (const category of Object.keys(newPosts)) {
          newPosts[category] = newPosts[category].filter((p) => p.id !== post.id);
          if (newPosts[category].length === 0) {
            delete newPosts[category];
          }
        }
        return newPosts;
      });
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSavingPostId(undefined);
    }
  };

  const handleMarkPosted = async (post: GeneratedPost) => {
    setMarkingPostId(post.id);
    try {
      await markPostedMutation.mutateAsync({ platform, post });
      // 投稿済みにしたら一覧から削除
      setGeneratedPosts((prev) => {
        const newPosts = { ...prev };
        for (const category of Object.keys(newPosts)) {
          newPosts[category] = newPosts[category].filter((p) => p.id !== post.id);
          if (newPosts[category].length === 0) {
            delete newPosts[category];
          }
        }
        return newPosts;
      });
    } catch (error) {
      console.error('Mark posted failed:', error);
    } finally {
      setMarkingPostId(undefined);
    }
  };

  const handleDelete = async (postId: string) => {
    try {
      await deleteMutation.mutateAsync({ platform, postId });
      // 削除したら一覧から削除
      setGeneratedPosts((prev) => {
        const newPosts = { ...prev };
        for (const category of Object.keys(newPosts)) {
          newPosts[category] = newPosts[category].filter((p) => p.id !== postId);
          if (newPosts[category].length === 0) {
            delete newPosts[category];
          }
        }
        return newPosts;
      });
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  // プラットフォーム変更時（生成結果は保持）
  const handlePlatformChange = (newPlatform: PostPlatform) => {
    setPlatform(newPlatform);
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">
                投稿作成
              </h1>
              <p className="text-sm text-gray-600">
                X/Threads向けの投稿を一括生成します
              </p>
            </div>
            <Link
              href="/posts/saved"
              className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-sm font-medium hover:bg-amber-100 transition-colors"
            >
              <Inbox className="w-4 h-4" />
              保存ボックス
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 左側: 条件入力 */}
            <div className="lg:col-span-1 space-y-6">
              {/* プラットフォーム選択 */}
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
                <h2 className="font-semibold text-gray-900 mb-4">プラットフォーム</h2>
                <PlatformToggle
                  platform={platform}
                  onPlatformChange={handlePlatformChange}
                />
              </div>

              {/* 生成条件 */}
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5">
                <h2 className="font-semibold text-gray-900 mb-4">生成条件</h2>
                <ConditionForm
                  conditions={conditions}
                  onConditionsChange={setConditions}
                  onGenerate={handleGenerate}
                  isGenerating={generateMutation.isPending}
                  countPerCondition={countPerCondition}
                  onCountChange={setCountPerCondition}
                />
              </div>

              {/* ヒント */}
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <h3 className="text-sm font-medium text-indigo-800 mb-2">
                  使い方のヒント
                </h3>
                <ul className="text-sm text-indigo-700 space-y-1">
                  <li>• 複数の条件を設定して一括生成できます</li>
                  <li>• 「投稿済み」を押すと学習データに追加されます</li>
                  <li>• 「保存」で後で使う投稿をストックできます</li>
                </ul>
              </div>
            </div>

            {/* 右側: 生成結果 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm p-5 min-h-[600px]">
                {generateMutation.isPending ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-600">投稿を生成しています...</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {conditions.length * countPerCondition}件を生成中
                    </p>
                  </div>
                ) : (
                  <PostList
                    posts={generatedPosts}
                    platform={platform}
                    onSave={handleSave}
                    onMarkPosted={handleMarkPosted}
                    onDelete={handleDelete}
                    savingPostId={savingPostId}
                    markingPostId={markingPostId}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
