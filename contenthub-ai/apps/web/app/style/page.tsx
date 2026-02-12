'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, FileText, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import type { StyleGuideType, StyleChatMessage } from '@contenthub/types';
import { Header } from '@/components/shared/Header';
import { AuthGuard } from '@/components/auth/AuthGuard';
import {
  useStyleGuide,
  useStyleChat,
} from '@/hooks/api/useStyleLearning';
import { StyleModeToggle, type StyleMode, SampleLearningPanel } from '@/components/style';

const STYLE_TABS: { type: StyleGuideType; label: string; description: string }[] = [
  { type: 'x', label: 'X投稿', description: '140字のつぶやき形式' },
  { type: 'threads', label: 'Threads', description: '500字の日記形式' },
  { type: 'note', label: 'NOTE', description: '記事形式（4種類）' },
];

export default function StylePage() {
  const [mode, setMode] = useState<StyleMode>('chat');
  const [selectedType, setSelectedType] = useState<StyleGuideType>('x');
  const [chatMessages, setChatMessages] = useState<StyleChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGuideExpanded, setIsGuideExpanded] = useState(true);

  const chatContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { data: styleGuide, isLoading: isLoadingGuide, refetch } = useStyleGuide(selectedType);
  const chatMutation = useStyleChat();

  // タブ切り替え時にチャット履歴をクリア
  useEffect(() => {
    setChatMessages([]);
    setInputMessage('');
  }, [selectedType]);

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
              文体学習
            </h1>
            <p className="text-sm text-gray-600">
              AIとのチャットで文体ガイドを調整・改善できます
            </p>
          </div>

          {/* モード切り替え */}
          <div className="mb-6">
            <StyleModeToggle mode={mode} onModeChange={setMode} />
          </div>

          {/* AIチャットモード: タブ選択 */}
          {mode === 'chat' && (
            <div className="flex gap-2 mb-6">
              {STYLE_TABS.map((tab) => (
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
                          {STYLE_TABS.find((t) => t.type === selectedType)?.label}文体ガイド
                        </h2>
                        <p className="text-xs text-gray-500">
                          {STYLE_TABS.find((t) => t.type === selectedType)?.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
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
                      文体ガイドについて質問や修正依頼ができます
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
                          こんにちは！文体ガイドについてお手伝いします。
                        </p>
                        <p className="text-sm text-gray-500">
                          例: 「語尾のパターンを増やしたい」「絵文字の使い方を見直したい」
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
                  <li>• ガイドが更新されると、左側のプレビューに反映されます</li>
                </ul>
              </div>
            </>
          ) : (
            <SampleLearningPanel />
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
