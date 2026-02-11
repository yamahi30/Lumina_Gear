'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { CalendarData, FrequencySettings } from '@contenthub/types';
import { apiPost, apiGet } from '@/lib/api';

/**
 * カレンダー生成リクエスト
 */
interface GenerateCalendarRequest {
  start_date: string;
  frequency_settings: FrequencySettings;
}

/**
 * カレンダー生成フック
 */
export function useGenerateCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: GenerateCalendarRequest) => {
      return apiPost<CalendarData>('/api/content-calendar/generate', request);
    },
    onSuccess: (data) => {
      // 生成されたカレンダーをキャッシュに保存
      queryClient.setQueryData(['calendar', data.calendar_id], data);
    },
  });
}

/**
 * カレンダー取得フック
 */
export function useCalendar(calendarId: string | null) {
  return useQuery({
    queryKey: ['calendar', calendarId],
    queryFn: async () => {
      if (!calendarId) return null;
      return apiGet<CalendarData>(`/api/content-calendar/${calendarId}`);
    },
    enabled: !!calendarId,
    staleTime: 1000 * 60 * 5, // 5分
  });
}

/**
 * カレンダー行再生成リクエスト
 */
interface RegenerateRowRequest {
  calendar_id: string;
  row_index: number;
  custom_instruction?: string;
}

/**
 * カレンダー行再生成フック
 */
export function useRegenerateRow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: RegenerateRowRequest) => {
      return apiPost('/api/content-calendar/regenerate-row', request);
    },
    onSuccess: (_, variables) => {
      // カレンダーを再取得
      queryClient.invalidateQueries({
        queryKey: ['calendar', variables.calendar_id],
      });
    },
  });
}
