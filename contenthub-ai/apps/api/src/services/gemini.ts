import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  FrequencySettings,
  CalendarPost,
  PostCondition,
  GeneratedPost,
  LearnedCharacteristics,
} from '@contenthub/types';
import { getDaysInMonth, formatDate, getDayOfWeek, generateId } from '@contenthub/utils';
import { CHARACTER_LIMITS } from '@contenthub/constants';

/**
 * Gemini APIサービス
 * コスト効率重視のタスクを担当（カレンダー生成、投稿作成など）
 */
export class GeminiService {
  private client: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.model = this.client.getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });
  }

  /**
   * JSONを修復（不正な文字や形式を修正）
   */
  private cleanJson(jsonStr: string): string {
    let cleaned = jsonStr
      // コントロール文字を除去
      .replace(/[\x00-\x1F\x7F]/g, ' ')
      // 不正なエスケープを修正
      .replace(/\\(?!["\\/bfnrtu])/g, '\\\\')
      // 末尾のカンマを除去
      .replace(/,(\s*[}\]])/g, '$1')
      // 複数のカンマを1つに
      .replace(/,+/g, ',');

    // 配列の終端を確認
    const lastBracket = cleaned.lastIndexOf(']');
    if (lastBracket > 0) {
      cleaned = cleaned.substring(0, lastBracket + 1);
    }

    return cleaned;
  }

  /**
   * コンテンツカレンダー生成（1週間ずつ生成してマージ）
   */
  async generateCalendar(
    startDate: Date,
    settings: FrequencySettings,
    styleData?: Record<string, LearnedCharacteristics>
  ): Promise<CalendarPost[]> {
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);

    const allPosts: CalendarPost[] = [];
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

    // 1週間ずつ生成
    for (let weekStart = 1; weekStart <= daysInMonth; weekStart += 7) {
      const weekEnd = Math.min(weekStart + 6, daysInMonth);

      try {
        const weekPosts = await this.generateWeekCalendar(
          year, month, weekStart, weekEnd, settings, dayNames
        );
        allPosts.push(...weekPosts);
        console.log(`Week ${Math.ceil(weekStart / 7)} generated: ${weekPosts.length} posts`);
      } catch (error) {
        console.error(`Failed to generate week ${weekStart}-${weekEnd}, using mock:`, error);
        // フォールバック: この週のモックデータを生成
        for (let day = weekStart; day <= weekEnd; day++) {
          const date = new Date(year, month, day);
          const dateStr = formatDate(date);
          const dayOfWeek = dayNames[date.getDay()];

          // X投稿
          for (let i = 0; i < settings.x_per_day; i++) {
            const times = ['07:30', '12:30', '21:00'];
            allPosts.push({
              date: dateStr,
              day_of_week: dayOfWeek,
              time: times[i] || '12:00',
              platform: 'X',
              category: 'HSP',
              title_idea: `${month + 1}/${day} 投稿案`,
              purpose: '共感形成',
              hashtags: ['#HSP'],
            });
          }
          // Threads投稿
          for (let i = 0; i < settings.threads_per_day; i++) {
            allPosts.push({
              date: dateStr,
              day_of_week: dayOfWeek,
              time: '10:00',
              platform: 'Threads',
              category: 'マインド',
              title_idea: `${month + 1}/${day} Threads投稿案`,
              purpose: '深い共感',
              hashtags: ['#繊細さん'],
            });
          }
        }
      }
    }

    return allPosts;
  }

  /**
   * 1週間分のカレンダーを生成（公開API）
   */
  async generateWeek(
    startDate: Date,
    startDay: number,
    endDay: number,
    settings: FrequencySettings
  ): Promise<CalendarPost[]> {
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

    return this.generateWeekCalendar(year, month, startDay, endDay, settings, dayNames);
  }

  /**
   * 1週間分のカレンダーを生成（内部）
   */
  private async generateWeekCalendar(
    year: number,
    month: number,
    startDay: number,
    endDay: number,
    settings: FrequencySettings,
    dayNames: string[]
  ): Promise<CalendarPost[]> {
    const monthStr = String(month + 1).padStart(2, '0');
    const categories = ['HSP', '家庭DX', 'IT・AI', 'マインド', 'NOTE誘導', 'Tips'];

    const prompt = `${year}年${month + 1}月${startDay}日〜${endDay}日のSNS投稿カレンダーをJSON配列で出力。

条件:
- X投稿: 1日${settings.x_per_day}回（時間: 07:30, 12:30, 21:00）
- Threads投稿: 1日${settings.threads_per_day}回（時間: 10:00）
- カテゴリ: ${categories.join(', ')}
- 対象: HSP女性エンジニア

JSON配列のみ出力（説明不要）:
[{"date":"${year}-${monthStr}-${String(startDay).padStart(2, '0')}","day_of_week":"${dayNames[new Date(year, month, startDay).getDay()]}","time":"07:30","platform":"X","category":"HSP","title_idea":"具体的な投稿アイデア","purpose":"目的","hashtags":["#HSP"]}]`;

    const result = await this.model.generateContent(prompt);
    const text = result.response.text();

    try {
      return JSON.parse(text) as CalendarPost[];
    } catch {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('Failed to parse week calendar JSON');
      }
      const cleanedJson = this.cleanJson(jsonMatch[0]);
      return JSON.parse(cleanedJson) as CalendarPost[];
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
以下のJSON配列のみを出力してください（説明文は不要）:
[
  {
    "content": "投稿本文（ハッシュタグ含む）",
    "hashtags": ["#タグ1", "#タグ2"]
  }
]
`;

      try {
        const result = await this.model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        const jsonMatch = text.match(/\[[\s\S]*\]/);
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
以下のJSONのみを出力してください（説明文は不要）:
{
  "date": "${post.date}",
  "day_of_week": "${post.day_of_week}",
  "time": ${post.time ? `"${post.time}"` : 'null'},
  "platform": "${post.platform}",
  "category": "カテゴリ名",
  "title_idea": "新しい投稿タイトル・内容案",
  "purpose": "投稿の目的",
  "hashtags": ["#タグ1", "#タグ2"]
}
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      const text = response.text();

      const jsonMatch = text.match(/\{[\s\S]*\}/);
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
   * ペルソナ生成
   */
  async generatePersona(attributes: {
    ageRange?: string;
    gender?: string;
    occupation?: string;
    interests?: string;
    challenges?: string;
    goals?: string;
  }): Promise<string> {
    const prompt = `
以下の属性からターゲット読者のペルソナ例を作成してください。

## 属性
- 年齢層: ${attributes.ageRange || '指定なし'}
- 性別: ${attributes.gender || '指定なし'}
- 職業: ${attributes.occupation || '指定なし'}
- 興味関心: ${attributes.interests || '指定なし'}
- 課題・悩み: ${attributes.challenges || '指定なし'}
- 目標: ${attributes.goals || '指定なし'}

## 出力形式
具体的な1人の人物像として、以下の項目を含めて作成してください:
- 名前（仮名）
- 年齢
- 職業・立場
- 日常の様子
- 抱えている悩み
- 求めている情報
- SNSの使い方

読みやすい文章形式で出力してください。
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Persona generation error:', error);
      throw error;
    }
  }
}
