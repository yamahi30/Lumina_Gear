import Anthropic from '@anthropic-ai/sdk';
import type {
  FrequencySettings,
  CalendarPost,
  PostCondition,
  GeneratedPost,
  StyleType,
  StyleGuideType,
  StyleChatMessage,
  LearnedCharacteristics,
} from '@contenthub/types';
import {
  CATEGORY_DISTRIBUTION,
  DEFAULT_POST_TIMES,
  CHARACTER_LIMITS,
} from '@contenthub/constants';
import { formatDate, getDayOfWeek, getDaysInMonth, generateId } from '@contenthub/utils';

/**
 * Claude APIサービス
 * 高品質なコンテンツ生成を担当
 */
export class ClaudeService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY,
    });
  }

  /**
   * コンテンツカレンダー生成
   */
  async generateCalendar(
    startDate: Date,
    settings: FrequencySettings,
    styleData?: Record<StyleType, LearnedCharacteristics>
  ): Promise<CalendarPost[]> {
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);

    // 投稿数計算
    const totalXPosts = settings.x_per_day * daysInMonth;
    const totalThreadsPosts = settings.threads_per_day * daysInMonth;

    const prompt = `
あなたはSNS運用のプロフェッショナルです。
HSP（繊細さん）女性エンジニア向けのコンテンツカレンダーを作成してください。

## 基本情報
- 対象月: ${year}年${month + 1}月
- X投稿: 1日${settings.x_per_day}回（計${totalXPosts}投稿）
- Threads投稿: 1日${settings.threads_per_day}回（計${totalThreadsPosts}投稿）
- NOTE記事:
  - 無料（アフィなし）: ${settings.note_free_no_affiliate_per_month}本/月
  - 無料（アフィあり）: ${settings.note_free_with_affiliate_per_month}本/月
  - メンバーシップ: ${settings.note_membership_per_month}本/月
  - 有料: ${settings.note_paid_per_month}本/月

## 発信の柱と配分（X投稿の場合）
- HSP共感: 21%
- 家庭DX: 23%
- IT資格: 13%
- マインド: 17%
- NOTE誘導: 23%
- プロフィール: 4%

## X投稿時間帯
- 朝: 07:30（最も反応が良い）
- 昼: 12:30
- 夜: 21:00

## Threads投稿時間帯
- 10:00

## 出力形式
以下のJSON形式で出力してください:
[
  {
    "date": "YYYY-MM-DD",
    "day_of_week": "月",
    "time": "07:30",
    "platform": "X",
    "category": "HSP共感",
    "title_idea": "具体的な投稿内容のアイデア",
    "purpose": "共感形成 → NOTE誘導",
    "hashtags": ["#HSP", "#AI活用"]
  }
]

${styleData ? `\n## 過去の好評投稿の特徴\n${JSON.stringify(styleData, null, 2)}` : ''}

30日分の投稿計画をJSON形式で出力してください。
`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        messages: [{ role: 'user', content: prompt }],
      });

      // レスポンスからJSONを抽出
      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      // JSON部分を抽出
      const jsonMatch = content.text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Failed to parse calendar JSON');
      }

      return JSON.parse(jsonMatch[0]) as CalendarPost[];
    } catch (error) {
      console.error('Claude API error:', error);
      throw error;
    }
  }

  /**
   * 投稿生成
   */
  async generatePosts(
    platform: 'x' | 'threads',
    conditions: PostCondition[],
    countPerCondition: number,
    styleData?: LearnedCharacteristics
  ): Promise<Record<string, GeneratedPost[]>> {
    const maxLength = platform === 'x' ? CHARACTER_LIMITS.X : CHARACTER_LIMITS.Threads;
    const results: Record<string, GeneratedPost[]> = {};

    for (const condition of conditions) {
      const prompt = `
あなたはSNS運用のプロフェッショナルです。
${platform === 'x' ? 'X（Twitter）' : 'Threads'}向けの投稿を${countPerCondition}個生成してください。

## 条件
- カテゴリ: ${condition.category}
- 発信内容: ${condition.content_idea}
- 目的: ${condition.purpose}
- ハッシュタグ: ${condition.hashtags}

## 文字数制限
- 最大${maxLength}文字

## ターゲット
- HSP（繊細さん）女性エンジニア
- 共働き、家庭とキャリアの両立に悩んでいる

${styleData ? `\n## 文体の特徴\n- トーン: ${styleData.tone}\n- 語尾: ${styleData.sentence_endings.join(', ')}\n- 絵文字: ${styleData.emoji_usage}` : ''}

## 出力形式
以下のJSON形式で${countPerCondition}個の投稿を出力してください:
[
  {
    "content": "投稿本文（ハッシュタグ含む）",
    "hashtags": ["#タグ1", "#タグ2"]
  }
]
`;

      try {
        const response = await this.client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }],
        });

        const content = response.content[0];
        if (content.type !== 'text') {
          throw new Error('Unexpected response type');
        }

        const jsonMatch = content.text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('Failed to parse posts JSON');
        }

        const parsed = JSON.parse(jsonMatch[0]) as { content: string; hashtags: string[] }[];
        results[condition.category] = parsed.map((p) => ({
          id: generateId(),
          content: p.content,
          character_count: p.content.length,
          hashtags: p.hashtags,
          category: condition.category,
          created_at: new Date().toISOString(),
        }));
      } catch (error) {
        console.error(`Failed to generate posts for ${condition.category}:`, error);
        results[condition.category] = [];
      }
    }

    return results;
  }

  /**
   * カレンダー1行の再生成
   */
  async regenerateRow(
    post: CalendarPost,
    customInstruction?: string
  ): Promise<CalendarPost> {
    const prompt = `
あなたはSNS運用のプロフェッショナルです。
以下のSNS投稿案を再生成してください。

## 現在の投稿案
- 日付: ${post.date}（${post.day_of_week}）
- 時間: ${post.time || '指定なし'}
- Platform: ${post.platform}
- カテゴリ: ${post.category}
- タイトル案: ${post.title_idea}
- 目的: ${post.purpose}
- ハッシュタグ: ${post.hashtags.join(' ')}

${customInstruction ? `## 修正指示\n${customInstruction}\n` : ''}

## ターゲット
HSP（繊細さん）女性エンジニア

## 出力形式
以下のJSON形式で1件の投稿案を出力してください:
{
  "date": "${post.date}",
  "day_of_week": "${post.day_of_week}",
  "time": ${post.time ? `"${post.time}"` : 'null'},
  "platform": "${post.platform}",
  "category": "カテゴリ名",
  "title_idea": "新しい投稿タイトル・内容案（50-100文字程度）",
  "purpose": "投稿の目的",
  "hashtags": ["#タグ1", "#タグ2", "#タグ3"]
}

JSONのみを出力してください。
`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse regenerated row JSON');
      }

      return JSON.parse(jsonMatch[0]) as CalendarPost;
    } catch (error) {
      console.error('Row regeneration error:', error);
      throw error;
    }
  }

  /**
   * 文体分析
   */
  async analyzeStyle(samples: string[]): Promise<LearnedCharacteristics> {
    const prompt = `
以下の文章サンプルから、文体の特徴を分析してください。

## サンプル
${samples.map((s, i) => `### サンプル${i + 1}\n${s}`).join('\n\n')}

## 分析項目
1. トーン（例: 共感的・温かい、プロフェッショナル、カジュアル）
2. 語尾パターン（例: です、ます、だよ）
3. 絵文字の使用頻度（例: 多め、少なめ、なし）
4. 段落スタイル（例: 短め、長め）
5. 頻出キーワード

## 出力形式
以下のJSON形式で出力してください:
{
  "tone": "トーンの説明",
  "sentence_endings": ["語尾1", "語尾2"],
  "emoji_usage": "絵文字使用の説明",
  "paragraph_style": "段落スタイルの説明",
  "keywords": ["キーワード1", "キーワード2"]
}
`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const jsonMatch = content.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse style analysis JSON');
      }

      return JSON.parse(jsonMatch[0]) as LearnedCharacteristics;
    } catch (error) {
      console.error('Style analysis error:', error);
      throw error;
    }
  }

  /**
   * スタイル学習チャット
   */
  async styleLearningChat(
    type: StyleGuideType,
    typeLabel: string,
    currentGuide: string,
    userMessage: string,
    history: StyleChatMessage[]
  ): Promise<{ response: string; updatedContent?: string }> {
    const systemPrompt = `あなたはSNS投稿の文体設計のプロフェッショナルです。
HSP（繊細さん）女性エンジニア向けのSNS運用を支援しています。

## あなたの役割
- ユーザーの${typeLabel}文体ガイドについての質問に回答する
- ユーザーの要望に応じて文体ガイドの内容を提案・修正する
- 文体のトーン、語尾、絵文字、構成などについてアドバイスする

## 現在の${typeLabel}文体ガイド
\`\`\`markdown
${currentGuide || '（まだ文体ガイドが設定されていません）'}
\`\`\`

## 応答ルール
1. ユーザーの質問には丁寧に回答してください
2. 文体ガイドの変更が必要な場合は、まず変更内容を説明してください
3. 変更を確定する場合は、以下の形式で更新後の完全なマークダウンを出力してください：

<guide_update>
（更新後の文体ガイド全文をここに記載）
</guide_update>

4. 変更がない場合や、単なる説明の場合は<guide_update>タグは出力しないでください
5. 変更を行う前に、ユーザーに確認を取ることを推奨します

## トーンと態度
- 親しみやすく、でも専門的に
- ユーザーの意図を汲み取って提案する
- 押し付けず、選択肢を提示する`;

    // 会話履歴を構築
    const messages: Anthropic.MessageParam[] = [];

    // 過去の履歴を追加
    for (const msg of history) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }

    // 新しいユーザーメッセージを追加
    messages.push({
      role: 'user',
      content: userMessage,
    });

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        system: systemPrompt,
        messages,
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      // ガイド更新があるかチェック
      const updateMatch = content.text.match(/<guide_update>([\s\S]*?)<\/guide_update>/);
      let updatedContent: string | undefined;

      if (updateMatch) {
        updatedContent = updateMatch[1].trim();
      }

      // 応答テキストから<guide_update>タグを除去
      const responseText = content.text.replace(/<guide_update>[\s\S]*?<\/guide_update>/g, '').trim();

      return {
        response: responseText,
        updatedContent,
      };
    } catch (error) {
      console.error('Style learning chat error:', error);
      throw error;
    }
  }
}
