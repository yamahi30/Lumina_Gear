'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiRequest } from '@/lib/api';
import type { NoteIdea, NoteIdeasData, FrequencySettings } from '@contenthub/types';

// NOTE頻度設定の型（note関連のみ）
export interface NoteFrequencySettings {
  note_free_no_affiliate_per_month: number;
  note_free_with_affiliate_per_month: number;
  note_membership_per_month: number;
  note_paid_per_month: number;
}

// NOTE記事案を取得
export function useNoteIdeas(month: string) {
  return useQuery({
    queryKey: ['note-ideas', month],
    queryFn: async () => {
      return apiGet<NoteIdeasData | null>(`/api/notes/ideas/${month}`);
    },
    enabled: !!month,
  });
}

// NOTE記事案を生成
export function useGenerateNoteIdeas() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      month,
      frequencySettings,
    }: {
      month: string;
      frequencySettings: NoteFrequencySettings;
    }) => {
      return apiPost<NoteIdeasData, {
        month: string;
        frequency_settings: NoteFrequencySettings;
      }>('/api/notes/generate-ideas', {
        month,
        frequency_settings: frequencySettings,
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['note-ideas', variables.month] });
    },
  });
}

// NOTE記事案を更新（承認・編集など）
export function useUpdateNoteIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      month,
      ideaId,
      updates,
    }: {
      month: string;
      ideaId: string;
      updates: Partial<NoteIdea>;
    }) => {
      return apiRequest<NoteIdea>(`/api/notes/ideas/${month}/${ideaId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['note-ideas', variables.month] });
    },
  });
}

// NOTE記事案を削除
export function useDeleteNoteIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      month,
      ideaId,
    }: {
      month: string;
      ideaId: string;
    }) => {
      return apiRequest<{ message: string }>(`/api/notes/ideas/${month}/${ideaId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['note-ideas', variables.month] });
    },
  });
}

// NOTE記事案を再生成
export function useRegenerateNoteIdea() {
  return useMutation({
    mutationFn: async ({
      ideaId,
      customInstruction,
    }: {
      ideaId: string;
      customInstruction?: string;
    }) => {
      return apiPost<{ message: string; idea_id: string }, {
        idea_id: string;
        custom_instruction?: string;
      }>('/api/notes/regenerate-idea', {
        idea_id: ideaId,
        custom_instruction: customInstruction,
      });
    },
  });
}

// NOTE記事のタイプ
export type NoteArticleType = 'free_no_affiliate' | 'free_with_affiliate' | 'membership' | 'paid';

// NOTE記事を生成
export function useGenerateNoteArticle() {
  return useMutation({
    mutationFn: async ({
      type,
      titleIdea,
      contentIdea,
      styleGuide,
    }: {
      type: NoteArticleType;
      titleIdea?: string;
      contentIdea?: string;
      styleGuide?: string;
    }) => {
      return apiPost<{ article: string }, {
        type: NoteArticleType;
        title_idea?: string;
        content_idea?: string;
        style_guide?: string;
      }>('/api/notes/generate-article', {
        type,
        title_idea: titleIdea,
        content_idea: contentIdea,
        style_guide: styleGuide,
      });
    },
  });
}

// NOTE記事をブラッシュアップ
export function useBrushUpNoteArticle() {
  return useMutation({
    mutationFn: async ({
      article,
      instruction,
    }: {
      article: string;
      instruction: string;
    }) => {
      return apiPost<{ article: string }, {
        article: string;
        instruction: string;
      }>('/api/notes/brush-up', {
        article,
        instruction,
      });
    },
  });
}
