'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, FileText, RefreshCw, ChevronDown, ChevronUp, Ban, Plus, Trash2, Edit3, Save, X, ArrowRight, Loader2 } from 'lucide-react';
import type { StyleGuideType, StyleChatMessage } from '@contenthub/types';
import { Header } from '@/components/shared/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import {
  useStyleGuide,
  useStyleChat,
  useUpdateStyleGuide,
} from '@/hooks/api/useStyleLearning';
import { StyleModeToggle, type StyleMode, SampleLearningPanel } from '@/components/style';
import {
  useNgExpressions,
  useAddNgExpression,
  useDeleteNgExpression,
  type NgExpression,
} from '@/hooks/api/useNgExpressions';

// スタイルタブをカテゴリ分け
const STYLE_TAB_CATEGORIES = [
  {
    category: 'SNS',
    tabs: [
      { type: 'x' as StyleGuideType, label: 'X投稿', description: '140字のつぶやき形式' },
      { type: 'threads' as StyleGuideType, label: 'Threads', description: '500字の日記形式' },
    ],
  },
  {
    category: 'NOTE',
    tabs: [
      { type: 'note_free' as StyleGuideType, label: '無料（アフィなし）', description: 'シンプルな無料記事' },
      { type: 'note_affiliate' as StyleGuideType, label: '無料（アフィあり）', description: 'アフィリエイト付き記事' },
      { type: 'note_membership' as StyleGuideType, label: 'メンバーシップ', description: '会員限定記事' },
      { type: 'note_paid' as StyleGuideType, label: '有料', description: '有料販売記事' },
    ],
  },
];

// フラットなタブリスト（既存コードとの互換性用）
const STYLE_TABS = STYLE_TAB_CATEGORIES.flatMap(cat => cat.tabs);

export default function StylePage() {
  const [mode, setMode] = useState<StyleMode>('chat');
  const [selectedType, setSelectedType] = useState<StyleGuideType>('x');
  const [chatMessages, setChatMessages] = useState<StyleChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGuideExpanded, setIsGuideExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: styleGuide, isLoading: isLoadingGuide, refetch } = useStyleGuide(selectedType);
  const chatMutation = useStyleChat();
  const updateGuideMutation = useUpdateStyleGuide();

  // タブ切り替え時にチャット履歴をクリア & 編集モードをリセット
  useEffect(() => {
    setChatMessages([]);
    setInputMessage('');
    setIsEditing(false);
    setEditContent('');
  }, [selectedType]);

  // 編集開始
  const handleStartEdit = () => {
    setEditContent(styleGuide?.content || '');
    setIsEditing(true);
  };

  // 編集キャンセル
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent('');
  };

  // 編集保存
  const handleSaveEdit = async () => {
    await updateGuideMutation.mutateAsync({
      type: selectedType,
      content: editContent,
    });
    setIsEditing(false);
    setEditContent('');
  };

  // 新しいメッセージが追加されたらスクロール
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || chatMutation.isPending) return;

    const userMessage: StyleChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date().toISOString(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setInputMessage('');

    // テキストエリアの高さをリセット
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const result = await chatMutation.mutateAsync({
        type: selectedType,
        message: userMessage.content,
        history: chatMessages,
      });

      if (result?.response) {
        setChatMessages((prev) => [...prev, result.response]);

        // ガイドが更新された場合はリフェッチ
        if (result.guideUpdated) {
          refetch();
        }
      }
    } catch (error) {
      // エラーメッセージを追加
      const errorMessage: StyleChatMessage = {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: `エラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`,
        timestamp: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputMessage(e.target.value);
    // 自動で高さを調整
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />

        <main className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight mb-2">
              文体構造学習
            </h1>
            <p className="text-sm text-gray-600">
              AIとのチャットで文体・構造ガイドを調整・改善できます
            </p>
          </div>

          {/* モード切り替え */}
          <div className="mb-6">
            <StyleModeToggle mode={mode} onModeChange={setMode} />
          </div>

          {/* AIチャットモード: タブ選択 */}
          {mode === 'chat' && (
            <div className="space-y-3 mb-6">
              {STYLE_TAB_CATEGORIES.map((category) => (
                <div key={category.category}>
                  <p className="text-xs font-medium text-gray-500 mb-2">{category.category}</p>
                  <div className="flex flex-wrap gap-2">
                    {category.tabs.map((tab) => (
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
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* モードに応じたコンテンツ表示 */}
          {mode === 'chat' ? (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 左側: スタイルガイド表示 */}
                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
                  <div
                    className="flex items-center justify-between px-5 py-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
                    onClick={() => setIsGuideExpanded(!isGuideExpanded)}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-indigo-500" />
                      <div>
                        <h2 className="font-semibold text-gray-900">
                          {STYLE_TABS.find((t) => t.type === selectedType)?.label}文体構造ガイド
                        </h2>
                        <p className="text-xs text-gray-500">
                          {STYLE_TABS.find((t) => t.type === selectedType)?.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {!isEditing && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEdit();
                          }}
                          className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                          title="編集"
                        >
                          <Edit3 className="w-4 h-4 text-gray-500" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          refetch();
                        }}
                        className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        title="再読み込み"
                      >
                        <RefreshCw className="w-4 h-4 text-gray-500" />
                      </button>
                      {isGuideExpanded ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  {isGuideExpanded && (
                    <div className="p-5 max-h-[600px] overflow-y-auto">
                      {isLoadingGuide ? (
                        <div className="flex items-center justify-center py-12">
                          <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : isEditing ? (
                        <div className="space-y-3">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full h-[400px] px-4 py-3 rounded-xl border border-gray-200
                              focus:border-indigo-300 focus:ring focus:ring-indigo-200/50
                              text-xs font-mono resize-none"
                            placeholder="文体構造ガイドを入力..."
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleCancelEdit}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2
                                bg-gray-100 text-gray-700 rounded-xl text-sm font-medium
                                hover:bg-gray-200 transition-colors"
                            >
                              <X className="w-4 h-4" />
                              キャンセル
                            </button>
                            <button
                              onClick={handleSaveEdit}
                              disabled={updateGuideMutation.isPending}
                              className="flex-1 flex items-center justify-center gap-2 px-4 py-2
                                bg-indigo-500 text-white rounded-xl text-sm font-medium
                                hover:bg-indigo-600 disabled:opacity-50 transition-colors"
                            >
                              {updateGuideMutation.isPending ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Save className="w-4 h-4" />
                              )}
                              保存
                            </button>
                          </div>
                        </div>
                      ) : styleGuide?.content ? (
                        <div className="prose prose-sm prose-gray max-w-none">
                          <pre className="whitespace-pre-wrap text-xs font-mono bg-gray-50 p-4 rounded-xl overflow-x-auto">
                            {styleGuide.content}
                          </pre>
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p>スタイルガイドがまだ設定されていません</p>
                          <button
                            onClick={handleStartEdit}
                            className="mt-3 px-4 py-2 bg-indigo-500 text-white rounded-xl text-sm font-medium hover:bg-indigo-600 transition-colors"
                          >
                            ガイドを作成
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 右側: チャットインターフェース */}
                <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm flex flex-col h-[700px]">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h2 className="font-semibold text-gray-900">AIアシスタント</h2>
                    <p className="text-xs text-gray-500">
                      文体・構造ガイドについて質問や修正依頼ができます
                    </p>
                  </div>

                  {/* チャットメッセージ表示 */}
                  <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-5 space-y-4"
                  >
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-50 flex items-center justify-center">
                          <span className="text-2xl">🌿</span>
                        </div>
                        <p className="text-gray-600 mb-2">
                          こんにちは！文体・構造ガイドについてお手伝いします。
                        </p>
                        <p className="text-sm text-gray-500">
                          例: 「語尾のパターンを増やしたい」「導入部分のテンプレートを作りたい」
                        </p>
                      </div>
                    ) : (
                      chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`
                              max-w-[85%] rounded-2xl px-4 py-3 text-sm
                              ${
                                msg.role === 'user'
                                  ? 'bg-indigo-500 text-white'
                                  : 'bg-gray-100 text-gray-800'
                              }
                            `}
                          >
                            <div className="whitespace-pre-wrap">{msg.content}</div>
                          </div>
                        </div>
                      ))
                    )}

                    {chatMutation.isPending && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-2xl px-4 py-3">
                          <div className="flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 入力エリア */}
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex gap-3">
                      <textarea
                        ref={textareaRef}
                        value={inputMessage}
                        onChange={handleTextareaChange}
                        onKeyDown={handleKeyDown}
                        placeholder="メッセージを入力..."
                        rows={1}
                        className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 transition-all resize-none text-sm"
                        disabled={chatMutation.isPending}
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || chatMutation.isPending}
                        className="px-4 py-3 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      >
                        <Send className="w-5 h-5" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Enter で送信 / Shift+Enter で改行
                    </p>
                  </div>
                </div>
              </div>

              {/* ヒント */}
              <div className="mt-6 p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <h3 className="text-sm font-medium text-indigo-800 mb-2">使い方のヒント</h3>
                <ul className="text-sm text-indigo-700 space-y-1">
                  <li>• 「〜のパターンを増やして」と依頼すると、AIがガイドを更新してくれます</li>
                  <li>• 「現在の語尾ルールを説明して」など、内容の確認もできます</li>
                  <li>• 「記事の導入部分をこう書きたい」など構造の指示もできます</li>
                  <li>• ガイドが更新されると、左側のプレビューに反映されます</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <SampleLearningPanel />
              <div className="mt-8">
                <NgExpressionsPanel />
              </div>
            </>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}

// NG表現タイプの選択肢
const NG_TYPE_OPTIONS: { value: NgExpression['type']; label: string; description: string }[] = [
  { value: 'word', label: '単語・表現', description: '使いたくない言葉' },
  { value: 'topic', label: '話題', description: '避けたいテーマ' },
  { value: 'tone', label: 'トーン', description: '避けたい雰囲気' },
];

// NG表現をスタイルガイド用にフォーマット
function formatNgExpressionsForGuide(expressions: NgExpression[]): string {
  if (expressions.length === 0) return '';

  let text = '## NG表現・避けたい話題\n\n';
  text += `（自動生成: ${new Date().toLocaleString('ja-JP')}）\n\n`;

  const grouped = {
    word: expressions.filter((e) => e.type === 'word'),
    topic: expressions.filter((e) => e.type === 'topic'),
    tone: expressions.filter((e) => e.type === 'tone'),
  };

  if (grouped.word.length > 0) {
    text += '### 避けるべき単語・表現\n';
    grouped.word.forEach(e => {
      text += `- ${e.content}${e.reason ? ` （理由: ${e.reason}）` : ''}\n`;
    });
    text += '\n';
  }

  if (grouped.topic.length > 0) {
    text += '### 避けるべき話題\n';
    grouped.topic.forEach(e => {
      text += `- ${e.content}${e.reason ? ` （理由: ${e.reason}）` : ''}\n`;
    });
    text += '\n';
  }

  if (grouped.tone.length > 0) {
    text += '### 避けるべきトーン\n';
    grouped.tone.forEach(e => {
      text += `- ${e.content}${e.reason ? ` （理由: ${e.reason}）` : ''}\n`;
    });
    text += '\n';
  }

  text += '## ---NG---\n';
  return text;
}

// 全スタイルガイドタイプ
const ALL_STYLE_GUIDE_TYPES: StyleGuideType[] = ['x', 'threads', 'note_free', 'note_affiliate', 'note_membership', 'note_paid'];

function NgExpressionsPanel() {
  const { data: ngData, isLoading } = useNgExpressions();
  const addMutation = useAddNgExpression();
  const deleteMutation = useDeleteNgExpression();
  const updateGuideMutation = useUpdateStyleGuide();

  const [newExpression, setNewExpression] = useState<Omit<NgExpression, 'id'>>({
    type: 'word',
    content: '',
    reason: '',
  });
  const [isApplying, setIsApplying] = useState(false);
  const [applySuccess, setApplySuccess] = useState(false);
  const [selectedGuideType, setSelectedGuideType] = useState<StyleGuideType>('x');

  // 選択中のスタイルガイドを取得
  const { data: styleGuide } = useStyleGuide(selectedGuideType);

  const expressions = ngData?.expressions || [];

  const handleAdd = async () => {
    if (!newExpression.content.trim()) return;
    await addMutation.mutateAsync(newExpression);
    setNewExpression({ type: 'word', content: '', reason: '' });
    setApplySuccess(false);
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    setApplySuccess(false);
  };

  // NG表現をスタイルガイドに反映
  const handleApply = async () => {
    if (expressions.length === 0) return;

    setIsApplying(true);
    setApplySuccess(false);

    try {
      const ngText = formatNgExpressionsForGuide(expressions);
      const currentContent = styleGuide?.content || '';

      // 既存のNG表現セクションを置換または追加
      let newContent = currentContent;
      const marker = '## NG表現・避けたい話題';
      const endMarker = '## ---NG---';

      if (currentContent.includes(marker)) {
        const startIdx = currentContent.indexOf(marker);
        const endIdx = currentContent.indexOf(endMarker, startIdx);
        if (endIdx > startIdx) {
          newContent = currentContent.substring(0, startIdx) +
                       ngText +
                       currentContent.substring(endIdx + endMarker.length);
        } else {
          newContent = currentContent.substring(0, startIdx) + ngText;
        }
      } else {
        newContent = currentContent + '\n\n' + ngText;
      }

      await updateGuideMutation.mutateAsync({
        type: selectedGuideType,
        content: newContent.trim(),
      });

      setApplySuccess(true);
    } catch (error) {
      console.error('Apply NG expressions failed:', error);
    } finally {
      setIsApplying(false);
    }
  };

  // タイプごとにグループ化
  const groupedExpressions = {
    word: expressions.filter((e) => e.type === 'word'),
    topic: expressions.filter((e) => e.type === 'topic'),
    tone: expressions.filter((e) => e.type === 'tone'),
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/60 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
        <Ban className="w-5 h-5 text-red-500" />
        <div>
          <h2 className="font-semibold text-gray-900">NG表現・避けたい話題</h2>
          <p className="text-xs text-gray-500">AI生成時にこれらの表現を避けます</p>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 左側: 登録済みNG表現 */}
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : expressions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Ban className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">まだNG表現が登録されていません</p>
              </div>
            ) : (
              <>
                {NG_TYPE_OPTIONS.map((typeOpt) => {
                  const items = groupedExpressions[typeOpt.value];
                  if (items.length === 0) return null;
                  return (
                    <div key={typeOpt.value}>
                      <h3 className="text-xs font-medium text-gray-500 mb-2">
                        {typeOpt.label}
                      </h3>
                      <div className="space-y-2">
                        {items.map((expr) => (
                          <div
                            key={expr.id}
                            className="flex items-start gap-2 p-2 bg-red-50 rounded-lg border border-red-100"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-800">{expr.content}</p>
                              {expr.reason && (
                                <p className="text-xs text-gray-500 mt-0.5">{expr.reason}</p>
                              )}
                            </div>
                            <button
                              onClick={() => handleDelete(expr.id)}
                              disabled={deleteMutation.isPending}
                              className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>

          {/* 右側: 新規追加 */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">種類</label>
              <select
                value={newExpression.type}
                onChange={(e) =>
                  setNewExpression({ ...newExpression, type: e.target.value as NgExpression['type'] })
                }
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm"
              >
                {NG_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} - {opt.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                内容 <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={newExpression.content}
                onChange={(e) => setNewExpression({ ...newExpression, content: e.target.value })}
                placeholder="例: 絶対に〜 / 政治的な話題 / 上から目線"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                理由（任意）
              </label>
              <input
                type="text"
                value={newExpression.reason}
                onChange={(e) => setNewExpression({ ...newExpression, reason: e.target.value })}
                placeholder="例: 押しつけがましく感じるため"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm"
              />
            </div>

            <button
              onClick={handleAdd}
              disabled={!newExpression.content.trim() || addMutation.isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {addMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              追加
            </button>

            {/* ヒント */}
            <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
              <p className="text-xs text-amber-800 font-medium mb-1">登録例</p>
              <ul className="text-xs text-amber-700 space-y-0.5">
                <li>• 単語: 「絶対」「必ず」「簡単に稼げる」</li>
                <li>• 話題: 「政治」「宗教」「特定の企業批判」</li>
                <li>• トーン: 「説教っぽい」「上から目線」</li>
              </ul>
            </div>
          </div>
        </div>

        {/* スタイルガイドに反映 */}
        {expressions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 mb-3">スタイルガイドに反映</h3>
            <div className="flex gap-3">
              <select
                value={selectedGuideType}
                onChange={(e) => setSelectedGuideType(e.target.value as StyleGuideType)}
                className="flex-1 px-3 py-2 rounded-xl border border-gray-200 focus:border-indigo-300 focus:ring focus:ring-indigo-200/50 text-sm"
              >
                <option value="x">X投稿</option>
                <option value="threads">Threads投稿</option>
                <option value="note_free">NOTE無料（アフィなし）</option>
                <option value="note_affiliate">NOTE無料（アフィあり）</option>
                <option value="note_membership">NOTEメンバーシップ</option>
                <option value="note_paid">NOTE有料</option>
              </select>
              <button
                onClick={handleApply}
                disabled={isApplying || expressions.length === 0}
                className="flex items-center justify-center gap-2 px-4 py-2
                  bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl
                  text-sm font-medium
                  hover:from-green-600 hover:to-emerald-600
                  disabled:opacity-50 disabled:cursor-not-allowed
                  transition-all"
              >
                {isApplying ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                反映
              </button>
            </div>
            {applySuccess && (
              <p className="text-xs text-green-600 mt-2">
                スタイルガイドに反映しました
              </p>
            )}
            {updateGuideMutation.isError && (
              <p className="text-xs text-red-600 mt-2">
                反映に失敗しました
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
