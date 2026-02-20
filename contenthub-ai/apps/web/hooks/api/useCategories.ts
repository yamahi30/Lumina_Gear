'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut, apiPost } from '@/lib/api';
import type { CategoryConfig, CategorySettings } from '@contenthub/types';

// カテゴリ設定を取得
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => apiGet<CategorySettings>('/api/categories'),
    staleTime: 1000 * 60 * 5, // 5分
  });
}

// カテゴリ設定を更新
export function useUpdateCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categories: CategoryConfig[]) => {
      return apiPut<CategorySettings>('/api/categories', { categories });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['categories'], data);
    },
  });
}

// カテゴリを追加
export function useAddCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newCategory: Omit<CategoryConfig, 'id'>) => {
      const current = queryClient.getQueryData<CategorySettings>(['categories']);
      const id = `category-${Date.now()}`;
      const category: CategoryConfig = { ...newCategory, id };
      const categories = [...(current?.categories || []), category];
      return apiPut<CategorySettings>('/api/categories', { categories });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['categories'], data);
    },
  });
}

// カテゴリを削除
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryId: string) => {
      const current = queryClient.getQueryData<CategorySettings>(['categories']);
      const categories = (current?.categories || []).filter((c) => c.id !== categoryId);
      return apiPut<CategorySettings>('/api/categories', { categories });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['categories'], data);
    },
  });
}

// デフォルトにリセット
export function useResetCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return apiPost<CategorySettings>('/api/categories/reset', {});
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['categories'], data);
    },
  });
}
