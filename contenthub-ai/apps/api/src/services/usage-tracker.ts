import fs from 'fs/promises';
import path from 'path';
import type { ApiUsageRecord, MonthlyUsage, ApiProvider, ProviderUsage } from '@contenthub/types';

// API料金設定（USD per 1M tokens）
const API_PRICING: Record<string, { input: number; output: number }> = {
  // Gemini
  'gemini-2.0-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  // Claude
  'claude-sonnet-4-20250514': { input: 3.00, output: 15.00 },
  'claude-3-5-sonnet-20241022': { input: 3.00, output: 15.00 },
  'claude-3-opus-20240229': { input: 15.00, output: 75.00 },
  'claude-3-haiku-20240307': { input: 0.25, output: 1.25 },
  // OpenAI（将来用）
  'gpt-4o': { input: 2.50, output: 10.00 },
  'gpt-4o-mini': { input: 0.15, output: 0.60 },
};

// デフォルト料金（不明なモデル用）
const DEFAULT_PRICING = { input: 1.00, output: 5.00 };

// 為替レート（概算）
const USD_TO_JPY = 150;

// ローカル保存ディレクトリ
const USAGE_DIR = path.resolve(process.cwd(), '../../data/usage');

// プロバイダ判定
function getProvider(model: string): ApiProvider {
  if (model.startsWith('gemini')) return 'gemini';
  if (model.startsWith('claude')) return 'claude';
  if (model.startsWith('gpt')) return 'openai';
  return 'gemini'; // デフォルト
}

// 空のプロバイダ使用量
function createEmptyProviderUsage(): ProviderUsage {
  return {
    calls: 0,
    input_tokens: 0,
    output_tokens: 0,
    total_tokens: 0,
    cost_usd: 0,
    cost_jpy: 0,
  };
}

/**
 * API使用量トラッカー
 */
class UsageTracker {
  private currentMonth: string;
  private monthlyData: MonthlyUsage;

  constructor() {
    this.currentMonth = this.getCurrentMonth();
    this.monthlyData = this.createEmptyMonthlyData(this.currentMonth);
  }

  private getCurrentMonth(): string {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  }

  private createEmptyMonthlyData(month: string): MonthlyUsage {
    return {
      month,
      total_calls: 0,
      total_input_tokens: 0,
      total_output_tokens: 0,
      total_tokens: 0,
      estimated_cost_usd: 0,
      estimated_cost_jpy: 0,
      by_provider: {
        gemini: createEmptyProviderUsage(),
        claude: createEmptyProviderUsage(),
        openai: createEmptyProviderUsage(),
      },
      by_function: {},
      records: [],
    };
  }

  /**
   * 使用量を記録
   */
  async trackUsage(
    functionName: string,
    model: string,
    inputTokens: number,
    outputTokens: number
  ): Promise<void> {
    const month = this.getCurrentMonth();

    // 月が変わっていたらデータをリセット
    if (month !== this.currentMonth) {
      await this.saveToFile();
      this.currentMonth = month;
      this.monthlyData = this.createEmptyMonthlyData(month);
      await this.loadFromFile();
    }

    // プロバイダ判定
    const provider = getProvider(model);

    // コスト計算
    const pricing = API_PRICING[model] || DEFAULT_PRICING;
    const inputCost = (inputTokens / 1_000_000) * pricing.input;
    const outputCost = (outputTokens / 1_000_000) * pricing.output;
    const totalCost = inputCost + outputCost;
    const totalTokens = inputTokens + outputTokens;

    // レコード作成
    const record: ApiUsageRecord = {
      timestamp: new Date().toISOString(),
      provider,
      function_name: functionName,
      model,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      estimated_cost_usd: totalCost,
    };

    // 全体集計更新
    this.monthlyData.total_calls++;
    this.monthlyData.total_input_tokens += inputTokens;
    this.monthlyData.total_output_tokens += outputTokens;
    this.monthlyData.total_tokens += totalTokens;
    this.monthlyData.estimated_cost_usd += totalCost;
    this.monthlyData.estimated_cost_jpy = this.monthlyData.estimated_cost_usd * USD_TO_JPY;

    // プロバイダ別集計
    if (!this.monthlyData.by_provider[provider]) {
      this.monthlyData.by_provider[provider] = createEmptyProviderUsage();
    }
    this.monthlyData.by_provider[provider].calls++;
    this.monthlyData.by_provider[provider].input_tokens += inputTokens;
    this.monthlyData.by_provider[provider].output_tokens += outputTokens;
    this.monthlyData.by_provider[provider].total_tokens += totalTokens;
    this.monthlyData.by_provider[provider].cost_usd += totalCost;
    this.monthlyData.by_provider[provider].cost_jpy = this.monthlyData.by_provider[provider].cost_usd * USD_TO_JPY;

    // 機能別集計
    if (!this.monthlyData.by_function[functionName]) {
      this.monthlyData.by_function[functionName] = {
        calls: 0,
        tokens: 0,
        cost_usd: 0,
      };
    }
    this.monthlyData.by_function[functionName].calls++;
    this.monthlyData.by_function[functionName].tokens += totalTokens;
    this.monthlyData.by_function[functionName].cost_usd += totalCost;

    // レコード追加（最新100件まで保持）
    this.monthlyData.records.push(record);
    if (this.monthlyData.records.length > 100) {
      this.monthlyData.records = this.monthlyData.records.slice(-100);
    }

    // ファイルに保存
    await this.saveToFile();

    console.log(`[Usage] ${provider}/${model}: ${totalTokens} tokens, $${totalCost.toFixed(6)}`);
  }

  /**
   * 今月の使用量を取得
   */
  async getMonthlyUsage(): Promise<MonthlyUsage> {
    const month = this.getCurrentMonth();

    if (month !== this.currentMonth) {
      this.currentMonth = month;
      this.monthlyData = this.createEmptyMonthlyData(month);
    }

    await this.loadFromFile();
    return this.monthlyData;
  }

  /**
   * ファイルから読み込み
   */
  private async loadFromFile(): Promise<void> {
    try {
      const filePath = path.join(USAGE_DIR, `${this.currentMonth}.json`);
      const content = await fs.readFile(filePath, 'utf-8');
      const loaded = JSON.parse(content) as MonthlyUsage;

      // by_providerが存在しない古いデータの場合は初期化
      if (!loaded.by_provider) {
        loaded.by_provider = {
          gemini: createEmptyProviderUsage(),
          claude: createEmptyProviderUsage(),
          openai: createEmptyProviderUsage(),
        };
      }

      this.monthlyData = loaded;
    } catch {
      // ファイルが存在しない場合は現在のデータを維持
    }
  }

  /**
   * ファイルに保存
   */
  private async saveToFile(): Promise<void> {
    try {
      await fs.mkdir(USAGE_DIR, { recursive: true });
      const filePath = path.join(USAGE_DIR, `${this.currentMonth}.json`);
      await fs.writeFile(filePath, JSON.stringify(this.monthlyData, null, 2), 'utf-8');
    } catch (error) {
      console.error('Failed to save usage data:', error);
    }
  }
}

// シングルトンインスタンス
export const usageTracker = new UsageTracker();
