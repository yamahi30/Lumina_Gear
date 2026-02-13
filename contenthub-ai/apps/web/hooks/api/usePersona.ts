'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiPost } from '@/lib/api';

// ペルソナ設定の型
export interface PersonaSettings {
  // 基本属性
  ageRange: string;
  gender: string;
  occupation: string;
  // 悩み・課題
  problems: string[];
  // 興味・関心
  interests: string[];
  // ペルソナ例
  personaExample: {
    name: string;
    age: number;
    job: string;
    description: string;
  };
  updated_at: string;
}

// デフォルトのペルソナ設定
const DEFAULT_PERSONA: PersonaSettings = {
  ageRange: '20〜30代',
  gender: '女性',
  occupation: '会社員・パートなど働く労働世代',
  problems: [
    '少しでも生活をよくしたい',
    '漠然とした将来への不安がある',
    '仕事が長続きしない',
    '会社の人間関係に疲れる',
    '自由な働き方に憧れる',
  ],
  interests: [
    'ITスキル',
    '手に職をつけること',
    '働き方の選択肢を増やすこと',
  ],
  personaExample: {
    name: 'あやか',
    age: 28,
    job: '事務職',
    description: '都内の中小企業で事務として働く会社員。人間関係に気を遣いすぎて疲れやすく、転職を何度か経験。「このままでいいのかな」という漠然とした不安を抱えている。SNSで同じような悩みを持つ人の投稿を見て共感したり、ITスキルや副業の情報を集めたりしている。自分のペースで働ける生き方に憧れている。',
  },
  updated_at: new Date().toISOString(),
};

const STORAGE_KEY = 'contenthub_persona';

// ローカルストレージから取得
function getStoredPersona(): PersonaSettings {
  if (typeof window === 'undefined') {
    return DEFAULT_PERSONA;
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // パースエラー時はデフォルトを返す
    }
  }

  return DEFAULT_PERSONA;
}

// ローカルストレージに保存
function savePersona(settings: PersonaSettings): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }
}

// ペルソナ設定を取得
export function usePersona() {
  return useQuery({
    queryKey: ['persona'],
    queryFn: () => getStoredPersona(),
    staleTime: Infinity,
  });
}

// ペルソナ設定を更新
export function useUpdatePersona() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (persona: Partial<PersonaSettings>) => {
      const current = getStoredPersona();
      const updated: PersonaSettings = {
        ...current,
        ...persona,
        updated_at: new Date().toISOString(),
      };
      savePersona(updated);
      return updated;
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
      savePersona(DEFAULT_PERSONA);
      return DEFAULT_PERSONA;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['persona'], data);
    },
  });
}

// AIでペルソナ例を生成
export function useGeneratePersonaExample() {
  return useMutation({
    mutationFn: async (attributes: {
      ageRange?: string;
      gender?: string;
      occupation?: string;
      interests?: string;
      challenges?: string;
      goals?: string;
    }) => {
      return apiPost<{ persona: string }, typeof attributes>(
        '/api/settings/generate-persona',
        attributes
      );
    },
  });
}
