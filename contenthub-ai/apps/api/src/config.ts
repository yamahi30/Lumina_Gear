/**
 * API設定
 * 開発中はUSE_CLAUDE_API=falseでモックデータを使用
 */

// Claude APIを使用するかどうか
// 環境変数 USE_CLAUDE_API=true で有効化（デフォルトは無効）
export const isClaudeEnabled = (): boolean => {
  return process.env.USE_CLAUDE_API === 'true' && !!process.env.CLAUDE_API_KEY;
};

// デバッグ用ログ
export const logApiMode = (): void => {
  if (isClaudeEnabled()) {
    console.log('🤖 Claude API: 有効');
  } else {
    console.log('📝 Claude API: 無効（モックデータ使用）');
  }
};
