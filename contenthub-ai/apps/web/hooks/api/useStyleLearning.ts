'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiRequest } from '@/lib/api';
import type {
  StyleGuideType,
  StyleGuideInfo,
  StyleChatMessage,
  StyleType,
  StyleLearningData,
} from '@contenthub/types';

// スタイルガイド一覧取得
export function useStyleGuides() {
  return useQuery({
    queryKey: ['style-guides'],
    queryFn: async () => {
      return apiGet<{ type: StyleGuideType; label: string; hasContent: boolean }[]>(
        '/api/style-learning/guides'
      );
    },
  });
}

// 特定のスタイルガイド取得
export function useStyleGuide(type: StyleGuideType | null) {
  return useQuery({
    queryKey: ['style-guide', type],
    queryFn: async () => {
      if (!type) return null;
      return apiGet<StyleGuideInfo>(`/api/style-learning/guides/${type}`);
    },
    enabled: !!type,
  });
}

// スタイルガイド更新
export function useUpdateStyleGuide() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      content,
    }: {
      type: StyleGuideType;
      content: string;
    }) => {
      return apiRequest<{ message: string; type: string }>(
        `/api/style-learning/guides/${type}`,
        {
          method: 'PUT',
          body: JSON.stringify({ content }),
        }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['style-guide', variables.type] });
      queryClient.invalidateQueries({ queryKey: ['style-guides'] });
    },
  });
}

// スタイル学習チャット
interface ChatResponse {
  response: StyleChatMessage;
  guideUpdated: boolean;
  updatedContent?: string;
}

export function useStyleChat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      message,
      history,
    }: {
      type: StyleGuideType;
      message: string;
      history?: StyleChatMessage[];
    }) => {
      return apiPost<ChatResponse, { type: StyleGuideType; message: string; history?: StyleChatMessage[] }>(
        '/api/style-learning/chat',
        { type, message, history }
      );
    },
    onSuccess: (data, variables) => {
      if (data?.guideUpdated) {
        queryClient.invalidateQueries({ queryKey: ['style-guide', variables.type] });
      }
    },
  });
}

// ========================================
// サンプル学習関連フック
// ========================================

// 学習データ取得
export function useStyleLearningData(type: StyleType | null) {
  return useQuery({
    queryKey: ['style-learning-data', type],
    queryFn: async () => {
      if (!type) return null;
      return apiGet<StyleLearningData | null>(`/api/style-learning/${type}`);
    },
    enabled: !!type,
  });
}

// サンプル保存
export function useSaveStyleSamples() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      samples,
    }: {
      type: StyleType;
      samples: string[];
    }) => {
      return apiRequest<StyleLearningData>(
        `/api/style-learning/${type}`,
        {
          method: 'PUT',
          body: JSON.stringify({ samples }),
        }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['style-learning-data', variables.type] });
    },
  });
}

// 学習実行（分析+保存）
export function useLearnStyle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      type,
      samples,
    }: {
      type: StyleType;
      samples: string[];
    }) => {
      return apiPost<StyleLearningData, { type: StyleType; samples: string[] }>(
        '/api/style-learning/learn',
        { type, samples }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['style-learning-data', variables.type] });
    },
  });
}
