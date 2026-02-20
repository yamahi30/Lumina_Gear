'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import type { CalendarPost } from '@contenthub/types';

interface TodayTasksResponse {
  date: string;
  posts: CalendarPost[];
}

interface SavedCountsResponse {
  x: number;
  threads: number;
  total: number;
}

/**
 * 今日のタスク取得
 */
export function useTodayTasks() {
  return useQuery({
    queryKey: ['dashboard', 'today'],
    queryFn: () => apiGet<TodayTasksResponse>('/api/dashboard/today'),
    staleTime: 1000 * 60 * 5, // 5分
  });
}

/**
 * 保存BOX件数取得
 */
export function useSavedCounts() {
  return useQuery({
    queryKey: ['dashboard', 'saved-counts'],
    queryFn: () => apiGet<SavedCountsResponse>('/api/dashboard/saved-counts'),
    staleTime: 1000 * 60 * 2, // 2分
  });
}
