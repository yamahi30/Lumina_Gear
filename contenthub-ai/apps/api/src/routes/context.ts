import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import type { MarketResearch, CustomInstructions, CompetitorAnalysis, PersonaData, PersonaList, ApiResponse } from '@contenthub/types';
import { isDriveEnabled } from '../config';
import { getDriveService } from '../services/drive-helper';
import { requireAuth } from './auth';

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
// ペルソナ
// ========================================

// デフォルトのペルソナ
const DEFAULT_PERSONA: PersonaData = {
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

/**
 * ペルソナ取得
 * GET /api/context/persona
 */
contextRouter.get('/persona', async (req, res) => {
  try {
    let data: PersonaData | null = null;

    // Google Driveから読み込み
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          data = await driveService.loadJson<PersonaData>('Context', 'persona.json');
        }
      } catch (driveError) {
        console.error('Failed to load persona from Drive:', driveError);
      }
    }

    // フォールバック: ローカルファイル
    if (!data) {
      try {
        const filePath = path.join(CONTEXT_DIR, 'persona.json');
        const content = await fs.readFile(filePath, 'utf-8');
        data = JSON.parse(content) as PersonaData;
      } catch {
        data = null;
      }
    }

    // デフォルト値
    if (!data) {
      data = DEFAULT_PERSONA;
    }

    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Get persona error:', error);
    res.status(500).json({ status: 'error', error: 'ペルソナの取得に失敗しました' });
  }
});

/**
 * ペルソナ更新
 * PUT /api/context/persona
 */
contextRouter.put('/persona', async (req, res) => {
  try {
    const personaInput = req.body as Partial<PersonaData>;

    const data: PersonaData = {
      ageRange: personaInput.ageRange || DEFAULT_PERSONA.ageRange,
      gender: personaInput.gender || DEFAULT_PERSONA.gender,
      occupation: personaInput.occupation || DEFAULT_PERSONA.occupation,
      problems: personaInput.problems || DEFAULT_PERSONA.problems,
      interests: personaInput.interests || DEFAULT_PERSONA.interests,
      personaExample: personaInput.personaExample || DEFAULT_PERSONA.personaExample,
      updated_at: new Date().toISOString(),
    };

    // ローカルに保存
    await ensureContextDir();
    const filePath = path.join(CONTEXT_DIR, 'persona.json');
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');

    // Google Driveに保存
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          await driveService.saveJson('Context', 'persona.json', data);
          console.log('✅ Persona saved to Google Drive');
        } else {
          console.log('⚠️ Drive service not available (no tokens?)');
        }
      } catch (driveError) {
        console.error('Failed to save persona to Drive:', driveError);
      }
    } else {
      console.log('ℹ️ Google Drive disabled, saved locally only');
    }

    res.json({ status: 'success', data });
  } catch (error) {
    console.error('Update persona error:', error);
    res.status(500).json({ status: 'error', error: 'ペルソナの更新に失敗しました' });
  }
});

// ========================================
// ペルソナ一覧（複数保存）
// ========================================

/**
 * ペルソナ一覧取得
 * GET /api/context/personas
 */
contextRouter.get('/personas', async (req, res) => {
  try {
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

    // デフォルト値（空の一覧）
    if (!data) {
      data = {
        personas: [],
        updated_at: new Date().toISOString(),
      };
    }

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

    // 既存のペルソナ一覧を取得
    let existingList: PersonaList = { personas: [], updated_at: '' };

    // Google Driveから読み込み
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          const loaded = await driveService.loadJson<PersonaList>('Context', 'personas.json');
          if (loaded) existingList = loaded;
        }
      } catch {
        // 無視
      }
    }

    // ローカルファイルから読み込み
    if (existingList.personas.length === 0) {
      try {
        const filePath = path.join(CONTEXT_DIR, 'personas.json');
        const content = await fs.readFile(filePath, 'utf-8');
        existingList = JSON.parse(content) as PersonaList;
      } catch {
        // 無視
      }
    }

    // 新しいペルソナを作成
    const newPersona: PersonaData = {
      id: `persona-${Date.now()}`,
      name: personaInput.name || `ペルソナ ${existingList.personas.length + 1}`,
      ageRange: personaInput.ageRange || DEFAULT_PERSONA.ageRange,
      gender: personaInput.gender || DEFAULT_PERSONA.gender,
      occupation: personaInput.occupation || DEFAULT_PERSONA.occupation,
      problems: personaInput.problems || DEFAULT_PERSONA.problems,
      interests: personaInput.interests || DEFAULT_PERSONA.interests,
      personaExample: personaInput.personaExample || DEFAULT_PERSONA.personaExample,
      updated_at: new Date().toISOString(),
    };

    // 一覧に追加
    existingList.personas.push(newPersona);
    existingList.updated_at = new Date().toISOString();

    // ローカルに保存
    await ensureContextDir();
    const filePath = path.join(CONTEXT_DIR, 'personas.json');
    await fs.writeFile(filePath, JSON.stringify(existingList, null, 2), 'utf-8');

    // Google Driveに保存
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          await driveService.saveJson('Context', 'personas.json', existingList);
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

    // 既存のペルソナ一覧を取得
    let existingList: PersonaList = { personas: [], updated_at: '' };

    // Google Driveから読み込み
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          const loaded = await driveService.loadJson<PersonaList>('Context', 'personas.json');
          if (loaded) existingList = loaded;
        }
      } catch {
        // 無視
      }
    }

    // ローカルファイルから読み込み
    if (existingList.personas.length === 0) {
      try {
        const filePath = path.join(CONTEXT_DIR, 'personas.json');
        const content = await fs.readFile(filePath, 'utf-8');
        existingList = JSON.parse(content) as PersonaList;
      } catch {
        // 無視
      }
    }

    // ペルソナを削除
    existingList.personas = existingList.personas.filter(p => p.id !== id);
    existingList.updated_at = new Date().toISOString();

    // ローカルに保存
    await ensureContextDir();
    const filePath = path.join(CONTEXT_DIR, 'personas.json');
    await fs.writeFile(filePath, JSON.stringify(existingList, null, 2), 'utf-8');

    // Google Driveに保存
    if (isDriveEnabled()) {
      try {
        const driveService = await getDriveService(req);
        if (driveService) {
          await driveService.saveJson('Context', 'personas.json', existingList);
          console.log('✅ Personas saved to Google Drive (after delete)');
        } else {
          console.log('⚠️ Drive service not available (no tokens?)');
        }
      } catch (driveError) {
        console.error('Failed to save personas to Drive:', driveError);
      }
    } else {
      console.log('ℹ️ Google Drive disabled, saved locally only');
    }

    res.json({ status: 'success', data: { message: 'ペルソナを削除しました' } });
  } catch (error) {
    console.error('Delete persona error:', error);
    res.status(500).json({ status: 'error', error: 'ペルソナの削除に失敗しました' });
  }
});
