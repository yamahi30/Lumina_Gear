'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { User } from '@contenthub/types';
import { apiGet, apiPost, apiRequest } from '@/lib/api';

/**
 * 現在のユーザー情報を取得
 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      return apiGet<User | null>('/api/auth/me');
    },
    staleTime: 1000 * 60 * 5, // 5分
    retry: false,
  });
}

/**
 * Google OAuth URLを取得
 */
export function useGoogleAuthUrl() {
  return useQuery({
    queryKey: ['auth', 'google-url'],
    queryFn: async () => {
      const response = await apiGet<{ url: string }>('/api/auth/google');
      return response.url;
    },
    enabled: false, // 手動でフェッチ
  });
}

/**
 * ログアウト
 */
export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiPost<{ message: string }>('/api/auth/logout', {});
    },
    onSuccess: () => {
      // キャッシュをクリア
      queryClient.setQueryData(['auth', 'me'], null);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });
}

/**
 * 認証状態のチェック
 */
export function useIsAuthenticated() {
  const { data: user, isLoading } = useCurrentUser();
  return {
    isAuthenticated: !!user,
    isLoading,
    user,
  };
}
