'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { MonthlyUsage } from '@contenthub/types';

/**
 * 今月のAPI使用量を取得
 */
export function useMonthlyUsage() {
  return useQuery({
    queryKey: ['usage', 'monthly'],
    queryFn: () => apiGet<MonthlyUsage>('/api/usage/monthly'),
    staleTime: 1000 * 60, // 1分
    refetchInterval: 1000 * 60 * 5, // 5分ごとに更新
  });
}
