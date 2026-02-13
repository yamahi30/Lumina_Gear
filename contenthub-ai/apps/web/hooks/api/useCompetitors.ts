'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 競合アカウントの型
export interface CompetitorAccount {
  id: string;
  platform: 'note' | 'x' | 'threads';
  username: string;       // アカウント名 or URL
  displayName?: string;   // 表示名
  description?: string;   // メモ
  followerCount?: string; // フォロワー数（任意）
}

export interface CompetitorSettings {
  accounts: CompetitorAccount[];
  updated_at: string;
}

// デフォルト（空）
const DEFAULT_COMPETITORS: CompetitorSettings = {
  accounts: [],
  updated_at: new Date().toISOString(),
};

const STORAGE_KEY = 'contenthub_competitors';

// ローカルストレージから取得
function getStoredCompetitors(): CompetitorSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_COMPETITORS;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // パースエラー時はデフォルトを返す
    }
  }

  return DEFAULT_COMPETITORS;
}

// ローカルストレージに保存
function saveCompetitors(settings: CompetitorSettings): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
}

// 競合アカウント設定を取得
export function useCompetitors() {
  return useQuery({
    queryKey: ['competitors'],
    queryFn: () => getStoredCompetitors(),
    staleTime: Infinity,
  });
}

// 競合アカウントを追加
export function useAddCompetitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (account: Omit<CompetitorAccount, 'id'>) => {
      const current = getStoredCompetitors();
      const newAccount: CompetitorAccount = {
        ...account,
        id: `competitor-${Date.now()}`,
      };
      const settings: CompetitorSettings = {
        accounts: [...current.accounts, newAccount],
        updated_at: new Date().toISOString(),
      };
      saveCompetitors(settings);
      return settings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['competitors'], data);
    },
  });
}

// 競合アカウントを更新
export function useUpdateCompetitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<CompetitorAccount> }) => {
      const current = getStoredCompetitors();
      const settings: CompetitorSettings = {
        accounts: current.accounts.map((a) =>
          a.id === id ? { ...a, ...updates } : a
        ),
        updated_at: new Date().toISOString(),
      };
      saveCompetitors(settings);
      return settings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['competitors'], data);
    },
  });
}

// 競合アカウントを削除
export function useDeleteCompetitor() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const current = getStoredCompetitors();
      const settings: CompetitorSettings = {
        accounts: current.accounts.filter((a) => a.id !== id),
        updated_at: new Date().toISOString(),
      };
      saveCompetitors(settings);
      return settings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['competitors'], data);
    },
  });
}
