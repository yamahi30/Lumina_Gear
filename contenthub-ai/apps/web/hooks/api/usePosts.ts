'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiRequest } from '@/lib/api';
import type { PostCondition, GeneratedPost, SavedPost } from '@contenthub/types';

export type PostPlatform = 'x' | 'threads';

// 投稿生成
export function useGeneratePosts() {
  return useMutation({
    mutationFn: async ({
      platform,
      conditions,
      countPerCondition,
    }: {
      platform: PostPlatform;
      conditions: PostCondition[];
      countPerCondition: number;
    }) => {
      return apiPost<Record<string, GeneratedPost[]>, {
        platform: PostPlatform;
        conditions: PostCondition[];
        count_per_condition: number;
      }>('/api/posts/generate', {
        platform,
        conditions,
        count_per_condition: countPerCondition,
      });
    },
  });
}

// 投稿を保存BOXに追加
export function useSavePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      platform,
      post,
    }: {
      platform: PostPlatform;
      post: GeneratedPost;
    }) => {
      return apiPost<SavedPost, { platform: PostPlatform; post: GeneratedPost }>(
        '/api/posts/save',
        { platform, post }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saved-posts', variables.platform] });
    },
  });
}

// 投稿済みとしてマーク
export function useMarkPosted() {
  return useMutation({
    mutationFn: async ({
      platform,
      post,
    }: {
      platform: PostPlatform;
      post: GeneratedPost;
    }) => {
      return apiPost<{ message: string }, { platform: PostPlatform; post: GeneratedPost }>(
        '/api/posts/mark-posted',
        { platform, post }
      );
    },
  });
}

// 投稿を削除
export function useDeletePost() {
  return useMutation({
    mutationFn: async ({
      platform,
      postId,
    }: {
      platform: PostPlatform;
      postId: string;
    }) => {
      return apiRequest<{ message: string }>(`/api/posts/${postId}`, {
        method: 'DELETE',
        body: JSON.stringify({ platform }),
      });
    },
  });
}

// 保存BOXの投稿一覧取得
export function useSavedPosts(platform: PostPlatform) {
  return useQuery({
    queryKey: ['saved-posts', platform],
    queryFn: async () => {
      return apiGet<SavedPost[]>(`/api/posts/saved/${platform}`);
    },
  });
}

// 保存済み投稿を削除
export function useDeleteSavedPost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      platform,
      postId,
    }: {
      platform: PostPlatform;
      postId: string;
    }) => {
      return apiRequest<{ message: string }>(`/api/posts/saved/${platform}/${postId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['saved-posts', variables.platform] });
    },
  });
}
