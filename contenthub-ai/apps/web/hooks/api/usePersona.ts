'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut, apiPost, apiDelete } from '@/lib/api';
import type { PersonaData, PersonaList } from '@contenthub/types';

// ペルソナ設定の型（フロントエンド用）
export interface PersonaSettings {
  id?: string;
  name?: string;
  ageRange: string;
  gender: string;
  occupation: string;
  problems: string[];
  interests: string[];
  personaExample: {
    name: string;
    age: number;
    job: string;
    description: string;
  };
  updated_at: string;
}

// 現在のペルソナ設定を取得（単一）
export function usePersona() {
  return useQuery({
    queryKey: ['persona'],
    queryFn: () => apiGet<PersonaSettings>('/api/context/persona'),
    staleTime: 1000 * 60 * 5, // 5分
  });
}

// ペルソナ設定を更新（単一）
export function useUpdatePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (persona: PersonaSettings) => {
      return apiPut<PersonaSettings>('/api/context/persona', persona);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['persona'], data);
    },
  });
}

// デフォルトにリセット
export function useResetPersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // 空のオブジェクトを送るとデフォルト値が返る
      return apiPut<PersonaSettings>('/api/context/persona', {});
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['persona'], data);
    },
  });
}

// ========================================
// 複数ペルソナ管理
// ========================================

// ペルソナ一覧を取得
export function usePersonaList() {
  return useQuery({
    queryKey: ['personas'],
    queryFn: () => apiGet<PersonaList>('/api/context/personas'),
    staleTime: 1000 * 60 * 5, // 5分
  });
}

// ペルソナを追加
export function useAddPersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (persona: PersonaSettings & { name: string }) => {
      return apiPost<PersonaData>('/api/context/personas', persona);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });
}

// ペルソナを削除
export function useDeletePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiDelete<{ message: string }>(`/api/context/personas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personas'] });
    },
  });
}
