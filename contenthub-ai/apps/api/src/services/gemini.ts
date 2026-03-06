import { GoogleGenerativeAI, GenerateContentResult } from '@google/generative-ai';
import type {
  FrequencySettings,
  CalendarPost,
  PostCondition,
  GeneratedPost,
  LearnedCharacteristics,
  ContentContext,
  PostedPost,
  CalendarPlatformType,
} from '@contenthub/types';
import { getDaysInMonth, formatDate, getDayOfWeek, generateId } from '@contenthub/utils';
import { CHARACTER_LIMITS } from '@contenthub/constants';
import { usageTracker } from './usage-tracker';

/**
 * Gemini APIサービス
 * コスト効率重視のタスクを担当（カレンダー生成、投稿作成など）
 */
export class GeminiService {
  private client: GoogleGenerativeAI;
  private model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;
  private modelName = 'gemini-2.0-flash';

  constructor() {
    this.client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    this.model = this.client.getGenerativeModel({
      model: this.modelName,
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });
  }

  /**
   * API使用量をトラッキング
   */
  private async trackUsage(functionName: string, result: GenerateContentResult): Promise<void> {
    try {
      const usage = result.response.usageMetadata;
      if (usage) {
        await usageTracker.trackUsage(
          functionName,
          this.modelName,
          usage.promptTokenCount || 0,
          usage.candidatesTokenCount || 0
        );
      }
    } catch (error) {
      console.error('Failed to track usage:', error);
    }
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
   * コンテキスト情報をプロンプト用に整形
   */
  private formatContextForPrompt(context?: ContentContext | null): string {
    if (!context) return '';

    const parts: string[] = [];

    // 投稿ジャンル（カテゴリ配分）
    if (context.categories && context.categories.length > 0) {
      const categoryText = context.categories
        .filter(c => c.percentage > 0)
        .sort((a, b) => b.percentage - a.percentage)
        .map(c => `- ${c.name}: ${c.percentage}%${c.description ? `（${c.description}）` : ''}`)
        .join('\n');
      parts.push(`【投稿ジャンル配分】\n${categoryText}`);
    }

    // ペルソナ情報
    if (context.persona) {
      const p = context.persona;
      const personaText = [
        `- 年代: ${p.ageRange}`,
        `- 性別: ${p.gender}`,
        `- 職業・立場: ${p.occupation}`,
        p.problems.length > 0 ? `- 悩み・課題: ${p.problems.join('、')}` : '',
        p.interests.length > 0 ? `- 興味・関心: ${p.interests.join('、')}` : '',
        p.personaExample.description ? `- 具体的なイメージ: ${p.personaExample.description}` : '',
      ].filter(Boolean).join('\n');
      parts.push(`【ターゲットペルソナ】\n${personaText}`);
    }

    // 調査ノート（記録があるもののみ）
    if (context.research_notes && context.research_notes.length > 0) {
      const notesWithContent = context.research_notes.filter(n => n.content && n.content.trim());
      if (notesWithContent.length > 0) {
        const notesText = notesWithContent
          .map(n => `■ ${n.name}\n${n.content}`)
          .join('\n\n');
        parts.push(`【調査ノート】\n${notesText}`);
      }
    }

    // カスタム指示
    if (context.custom_instructions?.trim()) {
      parts.push(`【カスタム指示】\n${context.custom_instructions}`);
    }

    // マイアカウント情報
    if (context.my_account) {
      const ma = context.my_account;
      const accountText = [
        ma.account_policy?.trim() ? `- アカウント方針: ${ma.account_policy}` : '',
        ma.content_pillars?.trim() ? `- 発信の軸: ${ma.content_pillars}` : '',
        ma.operation_rules?.trim() ? `- 運用ルール: ${ma.operation_rules}` : '',
        ma.brand_voice?.trim() ? `- ブランドボイス: ${ma.brand_voice}` : '',
      ].filter(Boolean).join('\n');
      if (accountText) {
        parts.push(`【マイアカウント】\n${accountText}`);
      }
    }

    if (parts.length === 0) return '';

    return `\n## コンテキスト情報\n${parts.join('\n\n')}`;
  }

  /**
   * 良い投稿の傾向をプロンプト用に整形
   */
  private formatGoodPostsForPrompt(goodPosts?: PostedPost[]): string {
    if (!goodPosts || goodPosts.length === 0) return '';

    const recentPosts = goodPosts.slice(-10); // 直近10件を使用
    const categories = recentPosts.map(p => p.category).filter(Boolean);
    const categoryCount: Record<string, number> = {};
    categories.forEach(c => {
      if (c) categoryCount[c] = (categoryCount[c] || 0) + 1;
    });

    const topCategories = Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    const sampleContents = recentPosts.slice(-3).map(p => `「${p.content.slice(0, 50)}...」`).join('\n');

    return `
## 過去に反響が良かった投稿の傾向
- よく選ばれるカテゴリ: ${topCategories.join(', ')}
- サンプル:
${sampleContents}
これらの傾向を参考にしつつ、新しいバリエーションも提案してください。`;
  }

  /**
   * コンテンツカレンダー生成（1週間ずつ生成してマージ）
   */
  async generateCalendar(
    startDate: Date,
    settings: FrequencySettings,
    context?: ContentContext | null
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
          year, month, weekStart, weekEnd, settings, dayNames, context
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
    settings: FrequencySettings,
    context?: ContentContext | null
  ): Promise<CalendarPost[]> {
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];

    return this.generateWeekCalendar(year, month, startDay, endDay, settings, dayNames, context);
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
    dayNames: string[],
    context?: ContentContext | null
  ): Promise<CalendarPost[]> {
    const monthStr = String(month + 1).padStart(2, '0');
    const categories = ['HSP', '家庭DX', 'IT・AI', 'マインド', 'NOTE誘導', 'Tips'];
    const contextPrompt = this.formatContextForPrompt(context);

    const prompt = `${year}年${month + 1}月${startDay}日〜${endDay}日のSNS投稿カレンダーをJSON配列で出力。

条件:
- X投稿: 1日${settings.x_per_day}回（時間: 07:30, 12:30, 21:00）
- Threads投稿: 1日${settings.threads_per_day}回（時間: 10:00）
- カテゴリ: ${categories.join(', ')}
- 対象: HSP女性エンジニア
${contextPrompt}

JSON配列のみ出力（説明不要）:
[{"date":"${year}-${monthStr}-${String(startDay).padStart(2, '0')}","day_of_week":"${dayNames[new Date(year, month, startDay).getDay()]}","time":"07:30","platform":"X","category":"HSP","title_idea":"具体的な投稿アイデア","purpose":"目的","hashtags":["#HSP"]}]`;

    const result = await this.model.generateContent(prompt);
    await this.trackUsage('generateWeekCalendar', result);
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
   * プラットフォーム別カレンダー生成
   * X/Threads: 1日分の投稿を生成
   * NOTE各種: 月単位で生成
   */
  async generatePlatformCalendar(
    platform: CalendarPlatformType,
    startDate: Date,
    frequency: number,
    context?: ContentContext | null
  ): Promise<CalendarPost[]> {
    const year = startDate.getFullYear();
    const month = startDate.getMonth();
    const day = startDate.getDate();
    const daysInMonth = getDaysInMonth(year, month);
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    const dayOfWeek = dayNames[startDate.getDay()];
    const contextPrompt = this.formatContextForPrompt(context);

    // 媒体タイプ別のラベル
    const platformLabels: Record<CalendarPlatformType, string> = {
      x: 'X',
      threads: 'Threads',
      note_free_no_affiliate: 'NOTE無料（アフィなし）',
      note_free_with_affiliate: 'NOTE無料（アフィあり）',
      note_membership: 'NOTEメンバーシップ',
      note_paid: 'NOTE有料',
    };

    const categories = ['HSP', '家庭DX', 'IT・AI', 'マインド', 'NOTE誘導', 'Tips'];
    const isDaily = platform === 'x' || platform === 'threads';

    if (isDaily) {
      // X, Threads: 指定日1日分のみ生成
      const times = platform === 'x' ? ['07:30', '12:30', '21:00'] : ['10:00', '19:00'];
      const targetDescription = context?.persona
        ? `上記ペルソナに該当するターゲット読者`
        : 'ターゲット読者';

      const prompt = `${year}年${month + 1}月${day}日（${dayOfWeek}）の${platformLabels[platform]}投稿を${frequency}件、JSON配列で出力。
${contextPrompt}

条件:
- ${frequency}件の投稿案を生成
- 投稿時間: ${times.slice(0, frequency).join(', ')}
- カテゴリ: ${categories.join(', ')} からバランス良く選択
- 対象: ${targetDescription}

各投稿について、ターゲットに響く具体的で実用的なタイトル案を提案してください。

JSON配列のみ出力（説明不要）:
[{"date":"${year}-${monthStr}-${dayStr}","day_of_week":"${dayOfWeek}","time":"${times[0]}","platform":"${platform === 'x' ? 'X' : 'Threads'}","category":"HSP","title_idea":"具体的な投稿アイデア","purpose":"目的","hashtags":["#HSP"]}]`;

      const result = await this.model.generateContent(prompt);
      await this.trackUsage(`generateCalendar_${platform}`, result);
      const text = result.response.text();

      try {
        return JSON.parse(text) as CalendarPost[];
      } catch {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('Failed to parse platform calendar JSON');
        }
        const cleanedJson = this.cleanJson(jsonMatch[0]);
        return JSON.parse(cleanedJson) as CalendarPost[];
      }
    } else {
      // NOTE各種: 月単位生成
      const noteTypeLabel = platformLabels[platform];
      const purpose = platform.includes('paid') || platform.includes('membership')
        ? '収益化・ファン育成'
        : '認知拡大・信頼構築';
      const targetDescription = context?.persona
        ? `上記ペルソナに該当するターゲット読者`
        : 'ターゲット読者';

      const prompt = `${year}年${month + 1}月の${noteTypeLabel}記事カレンダーをJSON配列で出力。
${contextPrompt}

条件:
- 月${frequency}本の記事
- カテゴリ: ${categories.join(', ')}
- 対象: ${targetDescription}
- 記事の目的: ${purpose}

記事は月全体に分散させ、ターゲットに響く具体的なタイトル案と概要を提案してください。

JSON配列のみ出力（説明不要）:
[{"date":"${year}-${monthStr}-01","day_of_week":"${dayNames[new Date(year, month, 1).getDay()]}","time":"","platform":"NOTE","category":"HSP","title_idea":"記事タイトル案","purpose":"${purpose}","hashtags":["#NOTE","#HSP"]}]`;

      const result = await this.model.generateContent(prompt);
      await this.trackUsage(`generateCalendar_${platform}`, result);
      const text = result.response.text();

      try {
        return JSON.parse(text) as CalendarPost[];
      } catch {
        const jsonMatch = text.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('Failed to parse NOTE calendar JSON');
        }
        const cleanedJson = this.cleanJson(jsonMatch[0]);
        return JSON.parse(cleanedJson) as CalendarPost[];
      }
    }
  }

  /**
   * 投稿生成
   */
  async generatePosts(
    platform: 'x' | 'threads',
    conditions: PostCondition[],
    countPerCondition: number,
    styleData?: LearnedCharacteristics,
    context?: ContentContext | null,
    goodPosts?: PostedPost[]
  ): Promise<Record<string, GeneratedPost[]>> {
    const maxLength = platform === 'x' ? CHARACTER_LIMITS.X : CHARACTER_LIMITS.Threads;
    const results: Record<string, GeneratedPost[]> = {};
    const contextPrompt = this.formatContextForPrompt(context);
    const goodPostsPrompt = this.formatGoodPostsForPrompt(goodPosts);

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
${contextPrompt}
${goodPostsPrompt}

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
        await this.trackUsage(`generatePosts_${platform}`, result);
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
      await this.trackUsage('regenerateRow', result);
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
      await this.trackUsage('generatePersona', result);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error('Persona generation error:', error);
      throw error;
    }
  }
}
