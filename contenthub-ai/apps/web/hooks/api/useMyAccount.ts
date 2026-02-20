'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiRequest } from '@/lib/api';
import type { MyAccountInfo } from '@contenthub/types';

/**
 * マイアカウント情報取得
 */
export function useMyAccount() {
  return useQuery({
    queryKey: ['my-account'],
    queryFn: () => apiGet<MyAccountInfo>('/api/my-account'),
    staleTime: 1000 * 60 * 5, // 5分
  });
}

/**
 * マイアカウント情報更新
 */
export function useUpdateMyAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<MyAccountInfo>) =>
      apiRequest<MyAccountInfo>('/api/my-account', {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-account'] });
    },
  });
}
