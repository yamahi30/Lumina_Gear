'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CategoryConfig, CategorySettings } from '@contenthub/types';

// デフォルトカテゴリ
const DEFAULT_CATEGORIES: CategoryConfig[] = [
  { id: 'hsp', name: 'HSP', description: 'HSP関連', percentage: 15, color: '#8B5CF6' },
  { id: 'home-dx', name: '家庭DX', description: '家庭のデジタル化・効率化', percentage: 15, color: '#10B981' },
  { id: 'it-ai', name: 'IT・AI', description: 'IT・AI関連の学習・情報', percentage: 15, color: '#3B82F6' },
  { id: 'mindset', name: 'マインド', description: 'マインドセット・考え方', percentage: 15, color: '#F59E0B' },
  { id: 'note-link', name: 'NOTE誘導', description: 'NOTE記事への誘導', percentage: 15, color: '#EC4899' },
  { id: 'tips', name: 'Tips', description: '小ネタ・お役立ち情報', percentage: 15, color: '#14B8A6' },
  { id: 'profile', name: 'プロフィール', description: '自己紹介・ブランディング', percentage: 5, color: '#6366F1' },
  { id: 'side-income', name: '副収入', description: '副業・収入関連', percentage: 5, color: '#F97316' },
];

const STORAGE_KEY = 'contenthub_categories';

// ローカルストレージから取得
function getStoredCategories(): CategorySettings {
  if (typeof window === 'undefined') {
    return {
      categories: DEFAULT_CATEGORIES,
      updated_at: new Date().toISOString(),
    };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // パースエラー時はデフォルトを返す
    }
  }

  return {
    categories: DEFAULT_CATEGORIES,
    updated_at: new Date().toISOString(),
  };
}

// ローカルストレージに保存
function saveCategories(settings: CategorySettings): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
}

// カテゴリ設定を取得
export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => getStoredCategories(),
    staleTime: Infinity,
  });
}

// カテゴリ設定を更新
export function useUpdateCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categories: CategoryConfig[]) => {
      const settings: CategorySettings = {
        categories,
        updated_at: new Date().toISOString(),
      };
      saveCategories(settings);
      return settings;
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
      const current = getStoredCategories();
      const id = `category-${Date.now()}`;
      const category: CategoryConfig = { ...newCategory, id };
      const settings: CategorySettings = {
        categories: [...current.categories, category],
        updated_at: new Date().toISOString(),
      };
      saveCategories(settings);
      return settings;
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
      const current = getStoredCategories();
      const settings: CategorySettings = {
        categories: current.categories.filter((c) => c.id !== categoryId),
        updated_at: new Date().toISOString(),
      };
      saveCategories(settings);
      return settings;
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
      const settings: CategorySettings = {
        categories: DEFAULT_CATEGORIES,
        updated_at: new Date().toISOString(),
      };
      saveCategories(settings);
      return settings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['categories'], data);
    },
  });
}
