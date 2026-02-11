'use client';

import { useState } from 'react';
import type { CalendarData, CalendarPost } from '@contenthub/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { Download, RefreshCw } from 'lucide-react';

interface CalendarTableProps {
  calendar: CalendarData;
  onRegenerateRow?: (rowIndex: number, instruction?: string) => void;
  isRegenerating?: boolean;
}

export function CalendarTable({
  calendar,
  onRegenerateRow,
  isRegenerating,
}: CalendarTableProps) {
  const [editingRow, setEditingRow] = useState<number | null>(null);
  const [editInstruction, setEditInstruction] = useState('');

  const handleRegenerateRow = (index: number) => {
    if (onRegenerateRow) {
      onRegenerateRow(index, editInstruction || undefined);
      setEditingRow(null);
      setEditInstruction('');
    }
  };

  const handleExportCSV = () => {
    const headers = ['日付', '曜日', '時間', 'Platform', 'カテゴリ', 'タイトル案', '目的', 'ハッシュタグ'];
    const rows = calendar.posts.map((post) => [
      post.date,
      post.day_of_week,
      post.time,
      post.platform,
      post.category,
      post.title_idea,
      post.purpose,
      post.hashtags.join(' '),
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `calendar_${calendar.start_date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // プラットフォーム別に色分け
  const platformColors: Record<string, string> = {
    X: 'bg-blue-100 text-blue-800',
    Threads: 'bg-purple-100 text-purple-800',
    NOTE: 'bg-green-100 text-green-800',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          生成されたカレンダー（{calendar.posts.length}件）
        </CardTitle>
        <Button variant="secondary" size="sm" onClick={handleExportCSV}>
          <Download className="w-4 h-4 mr-2" />
          CSV出力
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-600">日付</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">曜日</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">時間</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">Platform</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">カテゴリ</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600 min-w-[300px]">タイトル案</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">目的</th>
                <th className="text-left py-3 px-2 font-medium text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {calendar.posts.map((post, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors"
                >
                  <td className="py-3 px-2">{post.date}</td>
                  <td className="py-3 px-2">{post.day_of_week}</td>
                  <td className="py-3 px-2">{post.time || '-'}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                        platformColors[post.platform] || 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {post.platform}
                    </span>
                  </td>
                  <td className="py-3 px-2">{post.category}</td>
                  <td className="py-3 px-2">
                    <div className="max-w-[300px]">
                      <p className="text-gray-900">{post.title_idea}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {post.hashtags.join(' ')}
                      </p>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-gray-600">{post.purpose}</td>
                  <td className="py-3 px-2">
                    {editingRow === index ? (
                      <div className="flex flex-col gap-2 min-w-[200px]">
                        <input
                          type="text"
                          value={editInstruction}
                          onChange={(e) => setEditInstruction(e.target.value)}
                          placeholder="修正指示（任意）"
                          className="px-2 py-1 text-xs rounded-lg border border-gray-200
                                     focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={() => handleRegenerateRow(index)}
                            isLoading={isRegenerating}
                          >
                            再生成
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingRow(null);
                              setEditInstruction('');
                            }}
                          >
                            取消
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingRow(index)}
                      >
                        <RefreshCw className="w-3 h-3 mr-1" />
                        修正
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
