import { Router, Request as ExpressRequest } from 'express';
import fs from 'fs/promises';
import path from 'path';
import type { MarketResearch, CustomInstructions, CompetitorAnalysis, PersonaData, PersonaList, ApiResponse, ResearchNotes, ResearchItem, ResearchItemId } from '@contenthub/types';
import { isDriveEnabled, isGeminiEnabled } from '../config';
import { getDriveService } from '../services/drive-helper';
import { requireAuth } from './auth';
import { GeminiService } from '../services/gemini';

export const contextRouter = Router();

// 認証が必要
contextRouter.use(requireAuth);

// ローカル保存ディレクトリ
const CONTEXT_DIR = path.resolve(process.cwd(), '../../data/context');

// ディレクトリ確保
async function ensureContextDir() {
  try {
    await fs.mkdir(CONTEXT_DIR, { recursive: true });
  } catch {
    // 既存の場合は無視
  }
}

// ========================================
// 市場調査
// ========================================

/**
 * 市場調査取得
 * GET /api/context/market-research
 */
contextRouter.get('/market-research', async (req, res) => {
  try {
    let data: MarketResearch | null = null;

    // Google Driveから読み込み
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          data = await driveService.loadJson<MarketResearch>('Context', 'market-research.json');
        }
      } catch (driveError) {
        console.error('Failed to load market-research from Drive:', driveError);
      }
    }

    // フォールバック: ローカルファイル
    if (!data) {
      try {
        const filePath = path.join(CONTEXT_DIR, 'market-research.json');
        const content = await fs.readFile(filePath, 'utf-8');
        data = JSON.parse(content) as MarketResearch;
      } catch {
        data = null;
      }
    }

    // デフォルト値
    if (!data) {
      data = {
        content: '',
        updated_at: new Date().toISOString(),
      };
    }

    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Get market-research error:', error);
    res.status(500).json({ status: 'error', error: '市場調査の取得に失敗しました' });
  }
});

/**
 * 市場調査更新
 * PUT /api/context/market-research
 */
contextRouter.put('/market-research', async (req, res) => {
  try {
    const { content } = req.body as { content: string };

    const data: MarketResearch = {
      content: content || '',
      updated_at: new Date().toISOString(),
    };

    // ローカルに保存
    await ensureContextDir();
    const filePath = path.join(CONTEXT_DIR, 'market-research.json');
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    // Google Driveに保存
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          await driveService.saveJson('Context', 'market-research.json', data);
          console.log('✅ Market research saved to Google Drive');
        } else {
          console.log('⚠️ Drive service not available (no tokens?)');
        }
      } catch (driveError) {
        console.error('Failed to save market-research to Drive:', driveError);
      }
    } else {
      console.log('ℹ️ Google Drive disabled, saved locally only');
    }

    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Update market-research error:', error);
    res.status(500).json({ status: 'error', error: '市場調査の更新に失敗しました' });
  }
});

// ========================================
// カスタム指示
// ========================================

/**
 * カスタム指示取得
 * GET /api/context/custom-instructions
 */
contextRouter.get('/custom-instructions', async (req, res) => {
  try {
    let data: CustomInstructions | null = null;

    // Google Driveから読み込み
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          data = await driveService.loadJson<CustomInstructions>('Context', 'custom-instructions.json');
        }
      } catch (driveError) {
        console.error('Failed to load custom-instructions from Drive:', driveError);
      }
    }

    // フォールバック: ローカルファイル
    if (!data) {
      try {
        const filePath = path.join(CONTEXT_DIR, 'custom-instructions.json');
        const content = await fs.readFile(filePath, 'utf-8');
        data = JSON.parse(content) as CustomInstructions;
      } catch {
        data = null;
      }
    }

    // デフォルト値
    if (!data) {
      data = {
        content: '',
        updated_at: new Date().toISOString(),
      };
    }

    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Get custom-instructions error:', error);
    res.status(500).json({ status: 'error', error: 'カスタム指示の取得に失敗しました' });
  }
});

/**
 * カスタム指示更新
 * PUT /api/context/custom-instructions
 */
contextRouter.put('/custom-instructions', async (req, res) => {
  try {
    const { content } = req.body as { content: string };

    const data: CustomInstructions = {
      content: content || '',
      updated_at: new Date().toISOString(),
    };

    // ローカルに保存
    await ensureContextDir();
    const filePath = path.join(CONTEXT_DIR, 'custom-instructions.json');
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    // Google Driveに保存
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          await driveService.saveJson('Context', 'custom-instructions.json', data);
          console.log('✅ Custom instructions saved to Google Drive');
        } else {
          console.log('⚠️ Drive service not available (no tokens?)');
        }
      } catch (driveError) {
        console.error('Failed to save custom-instructions to Drive:', driveError);
      }
    } else {
      console.log('ℹ️ Google Drive disabled, saved locally only');
    }

    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Update custom-instructions error:', error);
    res.status(500).json({ status: 'error', error: 'カスタム指示の更新に失敗しました' });
  }
});

// ========================================
// 競合分析
// ========================================

/**
 * 競合分析取得
 * GET /api/context/competitor-analysis
 */
contextRouter.get('/competitor-analysis', async (req, res) => {
  try {
    let data: CompetitorAnalysis | null = null;

    // Google Driveから読み込み
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          data = await driveService.loadJson<CompetitorAnalysis>('Context', 'competitor-analysis.json');
        }
      } catch (driveError) {
        console.error('Failed to load competitor-analysis from Drive:', driveError);
      }
    }

    // フォールバック: ローカルファイル
    if (!data) {
      try {
        const filePath = path.join(CONTEXT_DIR, 'competitor-analysis.json');
        const content = await fs.readFile(filePath, 'utf-8');
        data = JSON.parse(content) as CompetitorAnalysis;
      } catch {
        data = null;
      }
    }

    // デフォルト値
    if (!data) {
      data = {
        content: '',
        updated_at: new Date().toISOString(),
      };
    }

    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Get competitor-analysis error:', error);
    res.status(500).json({ status: 'error', error: '競合分析の取得に失敗しました' });
  }
});

/**
 * 競合分析更新
 * PUT /api/context/competitor-analysis
 */
contextRouter.put('/competitor-analysis', async (req, res) => {
  try {
    const { content } = req.body as { content: string };

    const data: CompetitorAnalysis = {
      content: content || '',
      updated_at: new Date().toISOString(),
    };

    // ローカルに保存
    await ensureContextDir();
    const filePath = path.join(CONTEXT_DIR, 'competitor-analysis.json');
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    // Google Driveに保存
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          await driveService.saveJson('Context', 'competitor-analysis.json', data);
          console.log('✅ Competitor analysis saved to Google Drive');
        } else {
          console.log('⚠️ Drive service not available (no tokens?)');
        }
      } catch (driveError) {
        console.error('Failed to save competitor-analysis to Drive:', driveError);
      }
    } else {
      console.log('ℹ️ Google Drive disabled, saved locally only');
    }

    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Update competitor-analysis error:', error);
    res.status(500).json({ status: 'error', error: '競合分析の更新に失敗しました' });
  }
});

// ========================================
// ペルソナ（統合版: personas.json で一元管理）
// ========================================

// デフォルトのペルソナ
const DEFAULT_PERSONA: PersonaData = {
  id: 'default',
  name: 'デフォルト',
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
    description: '都内の中小企業で事務として働く会社員。人間関係に気を遣いすぎて疲れやすく、転職を何度か経験。「このままでいいのかな」という漠然とした不安を抱えている。',
  },
  updated_at: new Date().toISOString(),
};

// ペルソナ一覧を取得するヘルパー関数
async function loadPersonaList(req: ExpressRequest): Promise<PersonaList> {
  let data: PersonaList | null = null;

  // Google Driveから読み込み
  if (isDriveEnabled()) {
    try {
      const driveService = await getDriveService(req);
      if (driveService) {
        data = await driveService.loadJson<PersonaList>('Context', 'personas.json');
      }
    } catch (driveError) {
      console.error('Failed to load personas from Drive:', driveError);
    }
  }

  // フォールバック: ローカルファイル
  if (!data) {
    try {
      const filePath = path.join(CONTEXT_DIR, 'personas.json');
      const content = await fs.readFile(filePath, 'utf-8');
      data = JSON.parse(content) as PersonaList;
    } catch {
      data = null;
    }
  }

  // デフォルト値
  if (!data) {
    data = {
      personas: [DEFAULT_PERSONA],
      activePersonaId: 'default',
      updated_at: new Date().toISOString(),
    };
  }

  return data;
}

// ペルソナ一覧を保存するヘルパー関数
async function savePersonaList(req: ExpressRequest, data: PersonaList): Promise<void> {
  // ローカルに保存
  await ensureContextDir();
  const filePath = path.join(CONTEXT_DIR, 'personas.json');
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

  // Google Driveに保存
  if (isDriveEnabled()) {
    try {
      const driveService = await getDriveService(req);
      if (driveService) {
        await driveService.saveJson('Context', 'personas.json', data);
        console.log('✅ Personas saved to Google Drive');
      } else {
        console.log('⚠️ Drive service not available (no tokens?)');
      }
    } catch (driveError) {
      console.error('Failed to save personas to Drive:', driveError);
    }
  } else {
    console.log('ℹ️ Google Drive disabled, saved locally only');
  }
}

/**
 * 現在のアクティブなペルソナ取得
 * GET /api/context/persona
 */
contextRouter.get('/persona', async (req, res) => {
  try {
    const personaList = await loadPersonaList(req);

    // アクティブなペルソナを取得
    let activePersona = personaList.personas.find(p => p.id === personaList.activePersonaId);

    // アクティブなペルソナが見つからない場合は最初のペルソナを使用
    if (!activePersona && personaList.personas.length > 0) {
      activePersona = personaList.personas[0];
    }

    // ペルソナが1つもない場合はデフォルトを返す
    if (!activePersona) {
      activePersona = DEFAULT_PERSONA;
    }

    res.json({ status: 'success', data: activePersona });
  } catch (error) {
    console.error('Get persona error:', error);
    res.status(500).json({ status: 'error', error: 'ペルソナの取得に失敗しました' });
  }
});

/**
 * ペルソナ更新（アクティブなペルソナを更新、または新規追加）
 * PUT /api/context/persona
 */
contextRouter.put('/persona', async (req, res) => {
  try {
    const personaInput = req.body as Partial<PersonaData> & { name?: string };
    const personaList = await loadPersonaList(req);

    // 既存のペルソナを探す（IDまたは名前で）
    let existingIndex = -1;
    if (personaInput.id) {
      existingIndex = personaList.personas.findIndex(p => p.id === personaInput.id);
    } else if (personaInput.name) {
      existingIndex = personaList.personas.findIndex(p => p.name === personaInput.name);
    }

    const updatedPersona: PersonaData = {
      id: personaInput.id || (existingIndex >= 0 ? personaList.personas[existingIndex].id : `persona-${Date.now()}`),
      name: personaInput.name || (existingIndex >= 0 ? personaList.personas[existingIndex].name : `ペルソナ ${personaList.personas.length + 1}`),
      ageRange: personaInput.ageRange || DEFAULT_PERSONA.ageRange,
      gender: personaInput.gender || DEFAULT_PERSONA.gender,
      occupation: personaInput.occupation || DEFAULT_PERSONA.occupation,
      problems: personaInput.problems || DEFAULT_PERSONA.problems,
      interests: personaInput.interests || DEFAULT_PERSONA.interests,
      personaExample: personaInput.personaExample || DEFAULT_PERSONA.personaExample,
      updated_at: new Date().toISOString(),
    };

    if (existingIndex >= 0) {
      // 既存のペルソナを更新
      personaList.personas[existingIndex] = updatedPersona;
    } else {
      // 新規追加
      personaList.personas.push(updatedPersona);
    }

    // アクティブなペルソナに設定
    personaList.activePersonaId = updatedPersona.id;
    personaList.updated_at = new Date().toISOString();

    await savePersonaList(req, personaList);

    res.json({ status: 'success', data: updatedPersona });
  } catch (error) {
    console.error('Update persona error:', error);
    res.status(500).json({ status: 'error', error: 'ペルソナの更新に失敗しました' });
  }
});

/**
 * ペルソナ一覧取得
 * GET /api/context/personas
 */
contextRouter.get('/personas', async (req, res) => {
  try {
    const data = await loadPersonaList(req);
    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Get personas error:', error);
    res.status(500).json({ status: 'error', error: 'ペルソナ一覧の取得に失敗しました' });
  }
});

/**
 * ペルソナ追加
 * POST /api/context/personas
 */
contextRouter.post('/personas', async (req, res) => {
  try {
    const personaInput = req.body as Partial<PersonaData> & { name?: string };
    const personaList = await loadPersonaList(req);

    // 新しいペルソナを作成
    const newPersona: PersonaData = {
      id: `persona-${Date.now()}`,
      name: personaInput.name || `ペルソナ ${personaList.personas.length + 1}`,
      ageRange: personaInput.ageRange || DEFAULT_PERSONA.ageRange,
      gender: personaInput.gender || DEFAULT_PERSONA.gender,
      occupation: personaInput.occupation || DEFAULT_PERSONA.occupation,
      problems: personaInput.problems || DEFAULT_PERSONA.problems,
      interests: personaInput.interests || DEFAULT_PERSONA.interests,
      personaExample: personaInput.personaExample || DEFAULT_PERSONA.personaExample,
      updated_at: new Date().toISOString(),
    };

    // 一覧に追加
    personaList.personas.push(newPersona);
    personaList.activePersonaId = newPersona.id;  // 新規追加したものをアクティブに
    personaList.updated_at = new Date().toISOString();

    await savePersonaList(req, personaList);

    res.json({ status: 'success', data: newPersona });
  } catch (error) {
    console.error('Add persona error:', error);
    res.status(500).json({ status: 'error', error: 'ペルソナの追加に失敗しました' });
  }
});

/**
 * ペルソナ削除
 * DELETE /api/context/personas/:id
 */
contextRouter.delete('/personas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const personaList = await loadPersonaList(req);

    // ペルソナを削除
    personaList.personas = personaList.personas.filter(p => p.id !== id);

    // 削除したのがアクティブなペルソナだった場合、最初のペルソナをアクティブにする
    if (personaList.activePersonaId === id) {
      personaList.activePersonaId = personaList.personas.length > 0 ? personaList.personas[0].id : undefined;
    }

    personaList.updated_at = new Date().toISOString();

    await savePersonaList(req, personaList);

    res.json({ status: 'success', data: { message: 'ペルソナを削除しました' } });
  } catch (error) {
    console.error('Delete persona error:', error);
    res.status(500).json({ status: 'error', error: 'ペルソナの削除に失敗しました' });
  }
});

// ========================================
// ペルソナ例生成（AI）
// ========================================

interface PersonaExampleInput {
  ageRange: string;
  gender: string;
  occupation: string;
  problems: string[];
  interests: string[];
}

interface PersonaExampleOutput {
  name: string;
  age: number;
  job: string;
  description: string;
}

/**
 * ペルソナ例をAIで生成
 * POST /api/context/persona/generate-example
 */
contextRouter.post('/persona/generate-example', async (req, res) => {
  try {
    const input = req.body as PersonaExampleInput;

    // Gemini APIが有効かチェック
    if (!isGeminiEnabled()) {
      // モックデータを返す
      const names = ['ゆい', 'みさき', 'あやか', 'りな', 'さくら', 'ゆか', 'まい'];
      const randomName = names[Math.floor(Math.random() * names.length)];
      const ageMatch = input.ageRange.match(/(\d+)/);
      const baseAge = ageMatch ? parseInt(ageMatch[1]) : 25;
      const randomAge = baseAge + Math.floor(Math.random() * 10);

      const jobs = ['事務職', '営業', '販売スタッフ', 'カスタマーサポート', '経理', '一般事務'];
      const randomJob = jobs[Math.floor(Math.random() * jobs.length)];

      const problemText = input.problems.length > 0
        ? input.problems.slice(0, 2).join('、')
        : '日々の生活に少し疲れを感じている';
      const interestText = input.interests.length > 0
        ? input.interests.join('や')
        : '新しいスキル';

      const description = `${input.occupation}として働く${input.gender}。${problemText}と感じている。SNSで同じような境遇の人の発信を見て共感したり、${interestText}の情報を集めたりしている。もっと自分らしく、無理なく働ける生き方を模索中。`;

      const response: ApiResponse<PersonaExampleOutput> = {
        status: 'success',
        data: {
          name: randomName,
          age: randomAge,
          job: randomJob,
          description,
        },
      };
      return res.json(response);
    }

    // Gemini APIで生成
    const gemini = new GeminiService();

    // JSON出力用のモデルを使用
    const prompt = `以下の属性に基づいて、具体的なペルソナ例を1人生成してください。

## 属性
- 年代: ${input.ageRange}
- 性別: ${input.gender}
- 職業・立場: ${input.occupation}
- 悩み・課題: ${input.problems.join('、') || '特になし'}
- 興味・関心: ${input.interests.join('、') || '特になし'}

## 出力形式
以下のJSONのみを出力してください（説明文は不要）:
{
  "name": "ひらがなの名前（例: あやか、みさき）",
  "age": 数値のみ（例: 28）,
  "job": "具体的な職種（例: IT企業の事務職）",
  "description": "100〜150文字程度で、この人の日常・悩み・SNSとの関わり方を具体的に描写"
}`;

    const result = await gemini['model'].generateContent(prompt);
    await gemini['trackUsage']('generatePersonaExample', result);
    const text = result.response.text();

    // JSONをパース
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse persona example JSON');
    }

    const parsed = JSON.parse(jsonMatch[0]) as PersonaExampleOutput;

    const response: ApiResponse<PersonaExampleOutput> = {
      status: 'success',
      data: parsed,
    };

    res.json(response);
  } catch (error) {
    console.error('Generate persona example error:', error);
    res.status(500).json({ status: 'error', error: 'ペルソナ例の生成に失敗しました' });
  }
});

// ========================================
// 調査ノート（13項目）
// ========================================

// デフォルトの調査項目
const DEFAULT_RESEARCH_ITEMS: ResearchItem[] = [
  { id: 'hsp_trends', name: 'HSP女性のリアルな悩みトレンド', category: 'HSP×AI仕組み化術 / マインド×体験談', content: '', updated_at: new Date().toISOString() },
  { id: 'competitor_analysis', name: '競合アカウントの投稿パターン分析', category: '全柱共通', content: '', updated_at: new Date().toISOString() },
  { id: 'ai_news', name: 'AI最新情報（大衆が興味を持ちそうなもの）', category: 'HSP×AI仕組み化術', content: '', updated_at: new Date().toISOString() },
  { id: 'home_dx', name: '家庭DX・スマート家電・時短ライフハック情報', category: '女性の家庭DX実践術', content: '', updated_at: new Date().toISOString() },
  { id: 'it_career', name: 'IT資格・キャリア情報', category: 'IT資格×キャリアアップ', content: '', updated_at: new Date().toISOString() },
  { id: 'work_lifestyle', name: '女性の働き方・共働き・同居関連トレンド', category: 'マインド×体験談', content: '', updated_at: new Date().toISOString() },
  { id: 'note_popular', name: 'Noteの人気記事・売れ筋コンテンツ調査', category: 'NOTE誘導', content: '', updated_at: new Date().toISOString() },
  { id: 'affiliate_info', name: 'アフィリエイト案件の旬情報', category: '副収入×年収UP術', content: '', updated_at: new Date().toISOString() },
  { id: 'platform_algorithm', name: 'X・Threads・Noteのアルゴリズム・仕様変更情報', category: '全柱共通', content: '', updated_at: new Date().toISOString() },
  { id: 'seasonal_calendar', name: '季節・イベントカレンダー（翌月分）', category: '全柱共通', content: '', updated_at: new Date().toISOString() },
  { id: 'viral_formats', name: 'バズ投稿フォーマット収集', category: '全柱共通', content: '', updated_at: new Date().toISOString() },
  { id: 'gas_automation', name: 'GASを用いた業務効率化アイデアとヒントになる悩み', category: '副収入×年収UP術 / NOTE誘導', content: '', updated_at: new Date().toISOString() },
  { id: 'overseas_trends', name: '海外の市場調査・トレンド調査', category: '全柱共通（先行トレンド把握）', content: '', updated_at: new Date().toISOString() },
];

/**
 * 調査ノート取得
 * GET /api/context/research-notes
 */
contextRouter.get('/research-notes', async (req, res) => {
  try {
    let data: ResearchNotes | null = null;

    // Google Driveから読み込み
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          data = await driveService.loadJson<ResearchNotes>('Context', 'research-notes.json');
        }
      } catch (driveError) {
        console.error('Failed to load research-notes from Drive:', driveError);
      }
    }

    // フォールバック: ローカルファイル
    if (!data) {
      try {
        const filePath = path.join(CONTEXT_DIR, 'research-notes.json');
        const content = await fs.readFile(filePath, 'utf-8');
        data = JSON.parse(content) as ResearchNotes;
      } catch {
        data = null;
      }
    }

    // デフォルト値
    if (!data) {
      data = {
        items: DEFAULT_RESEARCH_ITEMS,
        updated_at: new Date().toISOString(),
      };
    }

    // 新しい項目が追加された場合に対応
    const existingIds = new Set(data.items.map(item => item.id));
    for (const defaultItem of DEFAULT_RESEARCH_ITEMS) {
      if (!existingIds.has(defaultItem.id)) {
        data.items.push(defaultItem);
      }
    }

    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Get research-notes error:', error);
    res.status(500).json({ status: 'error', error: '調査ノートの取得に失敗しました' });
  }
});

/**
 * 調査ノート更新（全項目）
 * PUT /api/context/research-notes
 */
contextRouter.put('/research-notes', async (req, res) => {
  try {
    const { items } = req.body as { items: ResearchItem[] };

    const data: ResearchNotes = {
      items: items || DEFAULT_RESEARCH_ITEMS,
      updated_at: new Date().toISOString(),
    };

    // ローカルに保存
    await ensureContextDir();
    const filePath = path.join(CONTEXT_DIR, 'research-notes.json');
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    // Google Driveに保存
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          await driveService.saveJson('Context', 'research-notes.json', data);
          console.log('✅ Research notes saved to Google Drive');
        } else {
          console.log('⚠️ Drive service not available (no tokens?)');
        }
      } catch (driveError) {
        console.error('Failed to save research-notes to Drive:', driveError);
      }
    } else {
      console.log('ℹ️ Google Drive disabled, saved locally only');
    }

    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Update research-notes error:', error);
    res.status(500).json({ status: 'error', error: '調査ノートの更新に失敗しました' });
  }
});

/**
 * 単一調査項目の更新
 * PUT /api/context/research-notes/:id
 */
contextRouter.put('/research-notes/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body as { content: string };

    // 現在のデータを取得
    let data: ResearchNotes | null = null;

    // Google Driveから読み込み
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          data = await driveService.loadJson<ResearchNotes>('Context', 'research-notes.json');
        }
      } catch (driveError) {
        console.error('Failed to load research-notes from Drive:', driveError);
      }
    }

    // フォールバック: ローカルファイル
    if (!data) {
      try {
        const filePath = path.join(CONTEXT_DIR, 'research-notes.json');
        const fileContent = await fs.readFile(filePath, 'utf-8');
        data = JSON.parse(fileContent) as ResearchNotes;
      } catch {
        data = {
          items: DEFAULT_RESEARCH_ITEMS,
          updated_at: new Date().toISOString(),
        };
      }
    }

    // 該当項目を更新
    const itemIndex = data.items.findIndex(item => item.id === id);
    if (itemIndex >= 0) {
      data.items[itemIndex].content = content;
      data.items[itemIndex].updated_at = new Date().toISOString();
    } else {
      return res.status(404).json({ status: 'error', error: '調査項目が見つかりません' });
    }

    data.updated_at = new Date().toISOString();

    // ローカルに保存
    await ensureContextDir();
    const filePath = path.join(CONTEXT_DIR, 'research-notes.json');
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    // Google Driveに保存
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          await driveService.saveJson('Context', 'research-notes.json', data);
          console.log('✅ Research note item saved to Google Drive');
        }
      } catch (driveError) {
        console.error('Failed to save research-notes to Drive:', driveError);
      }
    }

    res.json({ status: 'success', data: data.items[itemIndex] });
  } catch (error) {
    console.error('Update research-note item error:', error);
    res.status(500).json({ status: 'error', error: '調査項目の更新に失敗しました' });
  }
});
