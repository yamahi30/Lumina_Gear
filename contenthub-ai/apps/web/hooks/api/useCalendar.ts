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
  week_range?: { start: number; end: number };
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
  current_post?: CalendarData['posts'][0];
}

/**
 * カレンダー行再生成レスポンス
 */
interface RegenerateRowResponse {
  message: string;
  row_index: number;
  regenerated_post: CalendarData['posts'][0] | null;
}

/**
 * カレンダー行再生成フック
 */
export function useRegenerateRow() {
  return useMutation({
    mutationFn: async (request: RegenerateRowRequest) => {
      return apiPost<RegenerateRowResponse>('/api/content-calendar/regenerate-row', request);
    },
  });
}
