import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import type { PostCondition, GeneratedPost, SavedPost, ApiResponse } from '@contenthub/types';
import { generateId } from '@contenthub/utils';
import { ClaudeService } from '../services/claude';
import { isClaudeEnabled } from '../config';

export const postsRouter = Router();

// 保存データのディレクトリ
const SAVED_POSTS_DIR = path.resolve(process.cwd(), '../../data/saved-posts');

// ディレクトリ確保
async function ensureSavedPostsDir() {
  try {
    await fs.mkdir(SAVED_POSTS_DIR, { recursive: true });
  } catch {
    // 既存の場合は無視
  }
}

// 保存済み投稿を読み込む
async function loadSavedPosts(platform: 'x' | 'threads'): Promise<SavedPost[]> {
  const filePath = path.join(SAVED_POSTS_DIR, `${platform}_saved.json`);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as SavedPost[];
  } catch {
    return [];
  }
}

// 保存済み投稿を保存
async function savePosts(platform: 'x' | 'threads', posts: SavedPost[]): Promise<void> {
  await ensureSavedPostsDir();
  const filePath = path.join(SAVED_POSTS_DIR, `${platform}_saved.json`);
  await fs.writeFile(filePath, JSON.stringify(posts, null, 2), 'utf-8');
}

/**
 * 投稿生成
 * POST /api/posts/generate
 */
postsRouter.post('/generate', async (req, res) => {
  try {
    const { platform, conditions, count_per_condition } = req.body as {
      platform: 'x' | 'threads';
      conditions: PostCondition[];
      count_per_condition: number;
    };

    // 入力検証
    if (!platform || !conditions || conditions.length === 0) {
      return res.status(400).json({
        status: 'error',
        error: 'プラットフォームと条件は必須です',
      });
    }

    let posts: Record<string, GeneratedPost[]> = {};

    // Claude APIで投稿生成（有効な場合のみ）
    if (isClaudeEnabled()) {
      try {
        const claudeService = new ClaudeService();
        posts = await claudeService.generatePosts(
          platform,
          conditions,
          count_per_condition || 10
        );
      } catch (apiError) {
        console.error('Claude API error, using fallback:', apiError);
        for (const condition of conditions) {
          posts[condition.category] = generateMockPosts(
            condition,
            count_per_condition || 10,
            platform
          );
        }
      }
    } else {
      // モックデータを使用
      for (const condition of conditions) {
        posts[condition.category] = generateMockPosts(
          condition,
          count_per_condition || 10,
          platform
        );
      }
    }

    const response: ApiResponse<typeof posts> = {
      status: 'success',
      data: posts,
    };

    res.json(response);
  } catch (error) {
    console.error('Post generation error:', error);
    res.status(500).json({
      status: 'error',
      error: '投稿生成に失敗しました',
    });
  }
});

/**
 * 投稿を保存BOXに追加
 * POST /api/posts/save
 */
postsRouter.post('/save', async (req, res) => {
  try {
    const { platform, post } = req.body as {
      platform: 'x' | 'threads';
      post: GeneratedPost;
    };

    // 既存の保存済み投稿を読み込む
    const savedPosts = await loadSavedPosts(platform);

    // 重複チェック
    const exists = savedPosts.some((p) => p.id === post.id);
    if (exists) {
      return res.json({
        status: 'success',
        data: { ...post, saved_at: new Date().toISOString(), message: '既に保存済みです' },
      });
    }

    // 新しい投稿を追加
    const savedPost: SavedPost = {
      ...post,
      saved_at: new Date().toISOString(),
    };
    savedPosts.unshift(savedPost);

    // ファイルに保存
    await savePosts(platform, savedPosts);

    res.json({
      status: 'success',
      data: savedPost,
    });
  } catch (error) {
    console.error('Save post error:', error);
    res.status(500).json({
      status: 'error',
      error: '保存に失敗しました',
    });
  }
});

/**
 * 投稿済みとしてマーク（学習データに追加）
 * POST /api/posts/mark-posted
 */
postsRouter.post('/mark-posted', async (req, res) => {
  try {
    const { platform, post } = req.body as {
      platform: 'x' | 'threads';
      post: GeneratedPost;
    };

    // TODO: 学習フィードバックに追加
    // const driveService = new GoogleDriveService();
    // await driveService.addToGoodPosts(platform, post);

    res.json({
      status: 'success',
      data: { message: '投稿済みとして記録しました' },
    });
  } catch (error) {
    console.error('Mark posted error:', error);
    res.status(500).json({
      status: 'error',
      error: '記録に失敗しました',
    });
  }
});

/**
 * 投稿を削除（学習データに追加）
 * DELETE /api/posts/:id
 */
postsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { platform } = req.body as { platform: 'x' | 'threads' };

    // TODO: rejected_postsに追加
    // const driveService = new GoogleDriveService();
    // await driveService.addToRejectedPosts(platform, id);

    res.json({
      status: 'success',
      data: { message: '削除しました' },
    });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({
      status: 'error',
      error: '削除に失敗しました',
    });
  }
});

/**
 * 保存BOXの投稿一覧取得
 * GET /api/posts/saved/:platform
 */
postsRouter.get('/saved/:platform', async (req, res) => {
  try {
    const { platform } = req.params as { platform: 'x' | 'threads' };

    const savedPosts = await loadSavedPosts(platform);

    res.json({
      status: 'success',
      data: savedPosts,
    });
  } catch (error) {
    console.error('Get saved posts error:', error);
    res.status(500).json({
      status: 'error',
      error: '取得に失敗しました',
    });
  }
});

/**
 * 保存済み投稿を削除
 * DELETE /api/posts/saved/:platform/:id
 */
postsRouter.delete('/saved/:platform/:id', async (req, res) => {
  try {
    const { platform, id } = req.params as { platform: 'x' | 'threads'; id: string };

    const savedPosts = await loadSavedPosts(platform);
    const filteredPosts = savedPosts.filter((p) => p.id !== id);

    if (savedPosts.length === filteredPosts.length) {
      return res.status(404).json({
        status: 'error',
        error: '投稿が見つかりません',
      });
    }

    await savePosts(platform, filteredPosts);

    res.json({
      status: 'success',
      data: { message: '削除しました' },
    });
  } catch (error) {
    console.error('Delete saved post error:', error);
    res.status(500).json({
      status: 'error',
      error: '削除に失敗しました',
    });
  }
});

// カテゴリ別のサンプル投稿テンプレート
const MOCK_TEMPLATES: Record<string, string[]> = {
  'HSP共感': [
    '「なんで自分だけこんなに疲れるんだろう」って思ったことありませんか？\n\nHSPさんは、周りの情報を人一倍キャッチしてるから当然なんです。\n\n自分を責めないで。それは「繊細さ」という才能の裏返し。',
    '今日も1日お疲れさまでした。\n\n誰かの何気ない一言が気になって、ずっと頭の中でグルグル…HSPあるあるですよね。\n\nでも大丈夫。明日は明日の風が吹きます。',
    '「気にしすぎ」って言われるたびに傷ついてきた。\n\nでも最近わかったんです。気にしすぎなんじゃなくて、感じ取る力が強いだけ。\n\nこの繊細さ、実は武器になる。',
    'HSPさんが疲れやすい理由、知ってますか？\n\n脳が常にフル稼働してるから。だから休息は「サボり」じゃなくて「必要経費」。\n\n今日も自分を甘やかしていこう。',
    '「みんなは平気なのに、なんで私だけ…」\n\nそう思う夜もあるよね。でもね、HSPは人口の15-20%。5人に1人は同じ気持ちを抱えてる。\n\n一人じゃないよ。',
  ],
  '家庭DX': [
    '家事の「見える化」始めました。\n\nNotionで家事リストを共有したら、夫が自分から動くように…！\n\n「言わなきゃわからない」を「見ればわかる」に変えるだけで、こんなに変わるとは。',
    '食材管理アプリ導入3ヶ月。\n\n食品ロスが激減して、月の食費が1万円以上ダウン。\n\n「冷蔵庫の中身がわからない問題」、テクノロジーで解決できます。',
    '共働き家庭の味方、スマートリモコン。\n\n帰宅前にエアコンON、お風呂を沸かす、照明を点ける。\n\n「帰ったら何もしなくていい家」は作れる。',
    'ChatGPTに献立考えてもらったら、買い物リストまで出してくれた。\n\n「冷蔵庫にあるもので」って条件つけたら、ちゃんと考慮してくれる。\n\nAI、家庭の救世主かも。',
    'ルンバを買って半年。\n\n「床にモノを置かない習慣」が自然についた。\n\nお掃除ロボットの真の価値は、掃除してくれることより「片付けの動機づけ」かもしれない。',
  ],
  'IT資格': [
    '基本情報技術者、独学3ヶ月で合格しました。\n\n使ったのは過去問道場と動画教材のみ。\n\n通勤時間を勉強時間に変えるだけで、意外といける。',
    'AWS SAA、2回目でやっと合格…！\n\n1回目の失敗で学んだこと→ハンズオンは絶対やるべき。\n\n座学だけじゃ太刀打ちできない試験だった。',
    'IT資格って意味ある？って聞かれるけど、\n\n・転職で書類通過率UP\n・自己肯定感UP\n・知識の体系化\n\n少なくともこの3つは得られた。',
    '育休中にITパスポート取得。\n\n赤ちゃんの昼寝時間が勉強時間。細切れでも毎日30分続けたら受かった。\n\nスキマ時間、バカにできない。',
    '応用情報、3度目の正直で合格。\n\n諦めなくてよかった。不合格のたびに「もうやめよう」と思ったけど。\n\n続けた自分を褒めたい。',
  ],
  'マインド': [
    '「頑張らなきゃ」を手放したら、逆にパフォーマンス上がった。\n\n力みすぎると、本来の力が出ないのは仕事も同じ。\n\n70%の力で100%の成果を目指す。',
    '完璧主義をやめたら、仕事が楽しくなった。\n\n「60点でいいからまず出す」を意識したら、フィードバックが早くなって結果的に良いものができる。',
    '朝5分の瞑想を1ヶ月続けた結果。\n\n・イライラ減少\n・集中力UP\n・睡眠の質向上\n\nたった5分で人生変わるかも。',
    '「やらなきゃいけないこと」より「やりたいこと」を優先する日を作ってみた。\n\n罪悪感あったけど、翌日のパフォーマンスが全然違う。\n\n休息は投資。',
    '他人と比べて落ち込む癖、なかなか治らないけど、\n\n「昨日の自分」と比べるようにしたら、小さな成長に気づけるようになった。',
  ],
  'NOTE誘導': [
    'HSPさんの働き方、noteにまとめました。\n\n・疲れにくい環境の作り方\n・上司への伝え方\n・転職のコツ\n\n繊細さんが自分らしく働くヒント、詰め込みました。',
    '【無料公開】AI活用の始め方ガイド\n\nnoteで公開中です。\n\n「興味あるけど何から始めれば…」という方向けに、初心者でもできる活用法をまとめました。',
    '家庭DXの具体的なやり方、noteで解説してます。\n\n・おすすめアプリ\n・導入ステップ\n・失敗談と対策\n\n我が家の試行錯誤、参考になれば。',
    '基本情報技術者の勉強法、noteにまとめました。\n\n独学3ヶ月で合格した具体的なスケジュールと使った教材を公開。\n\n無料です。',
    'HSP×キャリアの悩み、noteで深掘りしてます。\n\n・向いてる仕事\n・避けた方がいい環境\n・面接での伝え方\n\nTwitterだと書ききれない内容、こっちで。',
  ],
  'プロフィール': [
    'はじめまして。HSP気質のエンジニアです。\n\n・IT企業で10年\n・2児の母\n・AI活用で家庭と仕事を両立中\n\n同じ悩みを持つ方と繋がりたいです。',
    '改めて自己紹介。\n\n繊細さんエンジニア / 共働き / 時短勤務\n\nAI×家庭DXで「頑張りすぎない働き方」を模索中。\n\nnoteでノウハウ発信してます。',
  ],
  '副収入': [
    'エンジニアの副業、3年続けてわかったこと。\n\n・スキルの棚卸しが大事\n・最初は単価より経験\n・本業との相乗効果を意識\n\n詳しくはnoteで。',
    'AI活用スキルが副収入に。\n\nChatGPTの使い方を教えるだけで、月5万円。\n\n「当たり前にできること」が誰かの「知りたいこと」だったりする。',
  ],
};

// 仮の投稿データ生成
function generateMockPosts(
  condition: PostCondition,
  count: number,
  platform: 'x' | 'threads'
): GeneratedPost[] {
  const maxLength = platform === 'x' ? 140 : 500;
  const posts: GeneratedPost[] = [];

  // カテゴリに対応するテンプレートを取得
  const templates = MOCK_TEMPLATES[condition.category] || MOCK_TEMPLATES['HSP共感'];
  const hashtags = condition.hashtags.split(' ').filter(Boolean);

  for (let i = 0; i < count; i++) {
    // テンプレートからランダムに選択し、バリエーションを追加
    const baseContent = templates[i % templates.length];
    let content = baseContent;

    // ハッシュタグを追加
    if (hashtags.length > 0) {
      content = `${baseContent}\n\n${hashtags.join(' ')}`;
    }

    // プラットフォームに応じて文字数調整
    if (content.length > maxLength) {
      content = content.slice(0, maxLength - 3) + '...';
    }

    posts.push({
      id: generateId(),
      content,
      character_count: content.length,
      hashtags,
      category: condition.category,
      created_at: new Date().toISOString(),
    });
  }

  return posts;
}
