'use client';

import { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, RefreshCw, Copy, Check, FileText, AlertCircle } from 'lucide-react';
import { Header } from '@/components/shared/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import {
  useGenerateNoteArticle,
  useBrushUpNoteArticle,
  type NoteArticleType,
} from '@/hooks/api/useNotes';

const NOTE_TYPE_TABS: { type: NoteArticleType; label: string; description: string }[] = [
  { type: 'free_no_affiliate', label: '無料', description: 'アフィリエイトなしの無料記事' },
  { type: 'free_with_affiliate', label: '無料（アフィリ）', description: 'アフィリエイト付き無料記事' },
  { type: 'membership', label: 'メンバーシップ', description: 'メンバーシップ限定記事' },
  { type: 'paid', label: '有料', description: '有料記事' },
];

export default function ArticleCreatePage() {
  // 記事タイプ選択
  const [selectedType, setSelectedType] = useState<NoteArticleType>('free_no_affiliate');

  // 入力フィールド
  const [titleIdea, setTitleIdea] = useState('');
  const [contentIdea, setContentIdea] = useState('');

  // 生成結果
  const [generatedArticle, setGeneratedArticle] = useState('');

  // ブラッシュアップ
  const [brushUpInstruction, setBrushUpInstruction] = useState('');

  // エラー状態
  const [error, setError] = useState<string | null>(null);

  // コピー状態
  const [copied, setCopied] = useState(false);

  const articleTextareaRef = useRef<HTMLTextAreaElement>(null);
  const brushUpTextareaRef = useRef<HTMLTextAreaElement>(null);

  // API フック
  const generateArticle = useGenerateNoteArticle();
  const brushUpArticle = useBrushUpNoteArticle();

  // タブ切り替え時にリセット
  useEffect(() => {
    setTitleIdea('');
    setContentIdea('');
    setGeneratedArticle('');
    setBrushUpInstruction('');
    setError(null);
  }, [selectedType]);

  // 記事生成
  const handleGenerate = async () => {
    if (!titleIdea.trim() && !contentIdea.trim()) return;

    setError(null);

    generateArticle.mutate(
      {
        type: selectedType,
        titleIdea: titleIdea.trim() || undefined,
        contentIdea: contentIdea.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          setGeneratedArticle(data.article);
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : '記事の生成に失敗しました');
        },
      }
    );
  };

  // ブラッシュアップ
  const handleBrushUp = async () => {
    if (!brushUpInstruction.trim() || !generatedArticle.trim()) return;

    setError(null);

    brushUpArticle.mutate(
      {
        article: generatedArticle,
        instruction: brushUpInstruction.trim(),
      },
      {
        onSuccess: (data) => {
          setGeneratedArticle(data.article);
          setBrushUpInstruction('');
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : 'ブラッシュアップに失敗しました');
        },
      }
    );
  };

  // 再生成
  const handleRegenerate = async () => {
    setError(null);

    generateArticle.mutate(
      {
        type: selectedType,
        titleIdea: titleIdea.trim() || undefined,
        contentIdea: contentIdea.trim() || undefined,
      },
      {
        onSuccess: (data) => {
          setGeneratedArticle(data.article);
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : '再生成に失敗しました');
        },
      }
    );
  };

  // ローディング状態
  const isGenerating = generateArticle.isPending;
  const isBrushingUp = brushUpArticle.isPending;

  // コピー
  const handleCopy = async () => {
    if (!generatedArticle) return;

    try {
      await navigator.clipboard.writeText(generatedArticle);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  // 記事編集時のテキストエリア自動リサイズ
  const handleArticleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setGeneratedArticle(e.target.value);
  };

  // ブラッシュアップ入力のEnter送信
  const handleBrushUpKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBrushUp();
    }
  };

  const canGenerate = (titleIdea.trim() || contentIdea.trim()) && !isGenerating;
  const canBrushUp = brushUpInstruction.trim() && generatedArticle.trim() && !isBrushingUp;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              記事作成
            </h1>
            <p className="text-sm text-gray-600">
              AIがNOTE記事を生成します。直接編集やブラッシュアップ指示も可能です。
            </p>
          </div>

          {/* 記事タイプタブ */}
          <div className="flex flex-wrap gap-2 mb-6">
            {NOTE_TYPE_TABS.map((tab) => (
              <button
                key={tab.type}
                onClick={() => setSelectedType(tab.type)}
                className={`
                  px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200
                  ${
                    selectedType === tab.type
                      ? 'bg-indigo-500 text-white shadow-sm'
                      : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                  }
                `}
                title={tab.description}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-800">エラーが発生しました</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 左側: 入力フォーム */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">記事の素材</h2>
                <p className="text-xs text-gray-500 mt-1">
                  タイトル案と内容を入力してください
                </p>
              </div>

              <div className="p-5 space-y-5">
                {/* タイトル案 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    タイトル案
                  </label>
                  <input
                    type="text"
                    value={titleIdea}
                    onChange={(e) => setTitleIdea(e.target.value)}
                    placeholder="例: 初心者でも分かるSNSマーケティング入門"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200
                      focus:border-indigo-300 focus:ring focus:ring-indigo-200/50
                      transition-all text-sm"
                    disabled={isGenerating}
                  />
                </div>

                {/* 内容 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    内容
                  </label>
                  <textarea
                    value={contentIdea}
                    onChange={(e) => setContentIdea(e.target.value)}
                    placeholder="例: ターゲット設定の重要性、投稿頻度の目安、ハッシュタグの活用法など"
                    rows={5}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200
                      focus:border-indigo-300 focus:ring focus:ring-indigo-200/50
                      transition-all text-sm resize-none"
                    disabled={isGenerating}
                  />
                </div>

                {/* 記事タイプの説明 */}
                <div className="p-3 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-600">
                    <span className="font-medium">選択中のタイプ: </span>
                    {NOTE_TYPE_TABS.find((t) => t.type === selectedType)?.description}
                  </p>
                </div>

                {/* 生成ボタン */}
                <button
                  onClick={handleGenerate}
                  disabled={!canGenerate}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3
                    bg-indigo-500 text-white rounded-xl text-sm font-medium
                    hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      記事を生成
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 右側: 生成結果 */}
            <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm flex flex-col h-[700px]">
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">生成された記事</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    直接編集できます
                  </p>
                </div>
                {generatedArticle && (
                  <div className="flex gap-2">
                    <button
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title="再生成"
                    >
                      <RefreshCw className={`w-4 h-4 text-gray-500 ${isGenerating ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={handleCopy}
                      className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      title="コピー"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-500" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* 記事表示・編集エリア */}
              <div className="flex-1 overflow-hidden p-5">
                {!generatedArticle && !isGenerating ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-50 flex items-center justify-center">
                      <FileText className="w-8 h-8 text-indigo-400" />
                    </div>
                    <p className="text-gray-600 mb-2">
                      まだ記事がありません
                    </p>
                    <p className="text-sm text-gray-500">
                      左側のフォームに情報を入力して「記事を生成」をクリックしてください
                    </p>
                  </div>
                ) : isGenerating ? (
                  <div className="h-full flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-600">記事を生成しています...</p>
                  </div>
                ) : (
                  <textarea
                    ref={articleTextareaRef}
                    value={generatedArticle}
                    onChange={handleArticleChange}
                    className="w-full h-full px-4 py-3 rounded-xl border border-gray-200
                      focus:border-indigo-300 focus:ring focus:ring-indigo-200/50
                      transition-all text-sm font-mono resize-none"
                  />
                )}
              </div>

              {/* ブラッシュアップ入力 */}
              {generatedArticle && !isGenerating && (
                <div className="p-4 border-t border-gray-100">
                  <div className="flex gap-3">
                    <textarea
                      ref={brushUpTextareaRef}
                      value={brushUpInstruction}
                      onChange={(e) => setBrushUpInstruction(e.target.value)}
                      onKeyDown={handleBrushUpKeyDown}
                      placeholder="ブラッシュアップ指示を入力... 例: もっとカジュアルな文体に / 見出しを増やして"
                      rows={1}
                      className="flex-1 px-4 py-3 rounded-xl border border-gray-200
                        focus:border-indigo-300 focus:ring focus:ring-indigo-200/50
                        transition-all resize-none text-sm"
                      disabled={isBrushingUp}
                    />
                    <button
                      onClick={handleBrushUp}
                      disabled={!canBrushUp}
                      className="px-4 py-3 rounded-xl bg-indigo-500 text-white
                        hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed
                        transition-all"
                    >
                      {isBrushingUp ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Enter で送信 / Shift+Enter で改行
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ヒント */}
          <div className="mt-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
            <h3 className="text-sm font-medium text-indigo-800 mb-2">使い方のヒント</h3>
            <ul className="text-sm text-indigo-700 space-y-1">
              <li>• タイトル案だけでも、内容だけでも記事を生成できます</li>
              <li>• 生成された記事は直接編集可能です</li>
              <li>• ブラッシュアップ指示で「もっと詳しく」「文体を変えて」などの修正ができます</li>
              <li>• 右上のコピーボタンでクリップボードにコピーできます</li>
            </ul>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
