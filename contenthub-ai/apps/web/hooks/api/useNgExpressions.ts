'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// NG表現の型
export interface NgExpression {
  id: string;
  type: 'word' | 'topic' | 'tone';  // 単語・話題・トーン
  content: string;
  reason?: string;  // 避ける理由
}

export interface NgExpressionsSettings {
  expressions: NgExpression[];
  updated_at: string;
}

// デフォルト
const DEFAULT_NG_EXPRESSIONS: NgExpressionsSettings = {
  expressions: [],
  updated_at: new Date().toISOString(),
};

const STORAGE_KEY = 'contenthub_ng_expressions';

// ローカルストレージから取得
function getStoredNgExpressions(): NgExpressionsSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_NG_EXPRESSIONS;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // パースエラー時はデフォルトを返す
    }
  }

  return DEFAULT_NG_EXPRESSIONS;
}

// ローカルストレージに保存
function saveNgExpressions(settings: NgExpressionsSettings): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
}

// NG表現を取得
export function useNgExpressions() {
  return useQuery({
    queryKey: ['ngExpressions'],
    queryFn: () => getStoredNgExpressions(),
    staleTime: Infinity,
  });
}

// NG表現を追加
export function useAddNgExpression() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (expression: Omit<NgExpression, 'id'>) => {
      const current = getStoredNgExpressions();
      const newExpression: NgExpression = {
        ...expression,
        id: `ng-${Date.now()}`,
      };
      const settings: NgExpressionsSettings = {
        expressions: [...current.expressions, newExpression],
        updated_at: new Date().toISOString(),
      };
      saveNgExpressions(settings);
      return settings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['ngExpressions'], data);
    },
  });
}

// NG表現を削除
export function useDeleteNgExpression() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const current = getStoredNgExpressions();
      const settings: NgExpressionsSettings = {
        expressions: current.expressions.filter((e) => e.id !== id),
        updated_at: new Date().toISOString(),
      };
      saveNgExpressions(settings);
      return settings;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['ngExpressions'], data);
    },
  });
}
