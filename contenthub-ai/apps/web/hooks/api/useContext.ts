'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiRequest } from '@/lib/api';
import type { MarketResearch, CustomInstructions, CompetitorAnalysis, ResearchNotes, ResearchItem, ResearchItemId } from '@contenthub/types';

/**
 * 市場調査取得
 */
export function useMarketResearch() {
  return useQuery({
    queryKey: ['market-research'],
    queryFn: () => apiGet<MarketResearch>('/api/context/market-research'),
    staleTime: 1000 * 60 * 5, // 5分
  });
}

/**
 * 市場調査更新
 */
export function useUpdateMarketResearch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      apiRequest<MarketResearch>('/api/context/market-research', {
        method: 'PUT',
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-research'] });
    },
  });
}

/**
 * カスタム指示取得
 */
export function useCustomInstructions() {
  return useQuery({
    queryKey: ['custom-instructions'],
    queryFn: () => apiGet<CustomInstructions>('/api/context/custom-instructions'),
    staleTime: 1000 * 60 * 5, // 5分
  });
}

/**
 * カスタム指示更新
 */
export function useUpdateCustomInstructions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      apiRequest<CustomInstructions>('/api/context/custom-instructions', {
        method: 'PUT',
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-instructions'] });
    },
  });
}

/**
 * 競合分析取得
 */
export function useCompetitorAnalysis() {
  return useQuery({
    queryKey: ['competitor-analysis'],
    queryFn: () => apiGet<CompetitorAnalysis>('/api/context/competitor-analysis'),
    staleTime: 1000 * 60 * 5, // 5分
  });
}

/**
 * 競合分析更新
 */
export function useUpdateCompetitorAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (content: string) =>
      apiRequest<CompetitorAnalysis>('/api/context/competitor-analysis', {
        method: 'PUT',
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['competitor-analysis'] });
    },
  });
}

// ========================================
// 調査ノート（13項目）
// ========================================

/**
 * 調査ノート取得
 */
export function useResearchNotes() {
  return useQuery({
    queryKey: ['research-notes'],
    queryFn: () => apiGet<ResearchNotes>('/api/context/research-notes'),
    staleTime: 1000 * 60 * 5, // 5分
  });
}

/**
 * 調査ノート全体更新
 */
export function useUpdateResearchNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: ResearchItem[]) =>
      apiRequest<ResearchNotes>('/api/context/research-notes', {
        method: 'PUT',
        body: JSON.stringify({ items }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-notes'] });
    },
  });
}

/**
 * 単一調査項目更新
 */
export function useUpdateResearchItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, content }: { id: ResearchItemId; content: string }) =>
      apiRequest<ResearchItem>(`/api/context/research-notes/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['research-notes'] });
    },
  });
}
