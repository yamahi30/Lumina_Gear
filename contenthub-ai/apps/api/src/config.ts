/**
 * API設定
 * 開発中はUSE_AI_API=falseでモックデータを使用
 */

// Claude APIを使用するかどうか（品質重視タスク用）
// 環境変数 USE_CLAUDE_API=true で有効化（デフォルトは無効）
export const isClaudeEnabled = (): boolean => {
  return process.env.USE_CLAUDE_API === 'true' && !!process.env.CLAUDE_API_KEY;
};

// Gemini APIを使用するかどうか（コスト重視タスク用）
// 環境変数 USE_GEMINI_API=true で有効化（デフォルトは無効）
export const isGeminiEnabled = (): boolean => {
  return process.env.USE_GEMINI_API === 'true' && !!process.env.GEMINI_API_KEY;
};

// Google Drive保存を使用するかどうか
export const isDriveEnabled = (): boolean => {
  return process.env.USE_GOOGLE_DRIVE === 'true';
};

// デバッグ用ログ
export const logApiMode = (): void => {
  console.log('--- API 設定 ---');
  if (isClaudeEnabled()) {
    console.log('🤖 Claude API: 有効（記事生成・文体学習）');
  } else {
    console.log('📝 Claude API: 無効（モックデータ使用）');
  }
  if (isGeminiEnabled()) {
    console.log('✨ Gemini API: 有効（カレンダー・投稿生成）');
  } else {
    console.log('📝 Gemini API: 無効（モックデータ使用）');
  }
  if (isDriveEnabled()) {
    console.log('📁 Google Drive: 有効');
  } else {
    console.log('💾 Google Drive: 無効（ローカル保存）');
  }
  console.log('-----------------');
};
