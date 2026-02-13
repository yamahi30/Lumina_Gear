import { Router } from 'express';
import type { ApiResponse } from '@contenthub/types';
import { GeminiService } from '../services/gemini';
import { isGeminiEnabled } from '../config';

export const settingsRouter = Router();

/**
 * ペルソナ生成
 * POST /api/settings/generate-persona
 */
settingsRouter.post('/generate-persona', async (req, res) => {
  try {
    const attributes = req.body as {
      ageRange?: string;
      gender?: string;
      occupation?: string;
      interests?: string;
      challenges?: string;
      goals?: string;
    };

    let persona: string;

    // Gemini APIでペルソナ生成（コスト効率重視）
    if (isGeminiEnabled()) {
      try {
        console.log('Generating persona with Gemini API...');
        const geminiService = new GeminiService();
        persona = await geminiService.generatePersona(attributes);
      } catch (apiError) {
        console.error('Gemini API error, using mock data:', apiError);
        persona = generateMockPersona(attributes);
      }
    } else {
      console.log('Gemini API key not set, using mock data...');
      persona = generateMockPersona(attributes);
    }

    const response: ApiResponse<{ persona: string }> = {
      status: 'success',
      data: { persona },
    };

    res.json(response);
  } catch (error) {
    console.error('Persona generation error:', error);
    res.status(500).json({
      status: 'error',
      error: 'ペルソナの生成に失敗しました',
    });
  }
});

// モックペルソナ生成
function generateMockPersona(attributes: {
  ageRange?: string;
  gender?: string;
  occupation?: string;
  interests?: string;
  challenges?: string;
  goals?: string;
}): string {
  return `【ペルソナ例】

名前: 田中 美咲（仮名）
年齢: ${attributes.ageRange || '28歳'}
性別: ${attributes.gender || '女性'}
職業: ${attributes.occupation || 'IT企業勤務のエンジニア'}

【日常の様子】
朝は6時半に起床。通勤電車の中でSNSをチェックするのが日課。
仕事はリモートワークと出社が半々。会議や締め切りに追われる日々。
夜は疲れて帰宅し、簡単な食事を済ませてからSNSを見て過ごすことが多い。

【興味関心】
${attributes.interests || 'AI活用、時短術、自己啓発'}

【抱えている悩み】
${attributes.challenges || '・仕事と家庭の両立が難しい\n・スキルアップしたいが時間がない\n・将来のキャリアに不安がある'}

【目標】
${attributes.goals || '・副収入を得たい\n・自分らしい働き方を見つけたい\n・同じ悩みを持つ仲間と繋がりたい'}

【SNSの使い方】
- 朝の通勤時間にX（Twitter）をチェック
- 気になる情報はブックマーク
- NOTEは週末にまとめて読む
- 共感できる投稿にはいいね、リポスト`;
}
