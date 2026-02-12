'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/shared/Card';
import { Button } from '@/components/shared/Button';
import { useCurrentUser } from '@/hooks/api/useAuth';
import { apiGet } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: user, isLoading } = useCurrentUser();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // エラーパラメータをチェック
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam === 'no_code') {
      setError('認証コードが取得できませんでした。もう一度お試しください。');
    } else if (errorParam === 'auth_failed') {
      setError('認証に失敗しました。もう一度お試しください。');
    }
  }, [searchParams]);

  // 認証済みならダッシュボードへ
  useEffect(() => {
    if (user && !isLoading) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  const handleGoogleLogin = async () => {
    setIsRedirecting(true);
    setError(null);

    try {
      const response = await apiGet<{ url: string }>('/api/auth/google');
      window.location.href = response.url;
    } catch (err) {
      setError('認証URLの取得に失敗しました。');
      setIsRedirecting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* ロゴ・タイトル */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-2">
            ContentHub AI
          </h1>
          <p className="text-gray-600">
            SNS運用を自動化するAIツール
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">ログイン</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* エラー表示 */}
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* 説明文 */}
              <p className="text-sm text-gray-600 text-center">
                Googleアカウントでログインすると、以下の機能が利用できます：
              </p>

              {/* 機能リスト */}
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">✓</span>
                  コンテンツカレンダー自動生成
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">✓</span>
                  X・Threads投稿の一括作成
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">✓</span>
                  NOTE記事案の生成
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs">✓</span>
                  Google Driveへのデータ保存
                </li>
              </ul>

              {/* ログインボタン */}
              <Button
                onClick={handleGoogleLogin}
                className="w-full"
                isLoading={isRedirecting}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Googleでログイン
              </Button>

              {/* 注意書き */}
              <p className="text-xs text-gray-500 text-center">
                ログインすることで、
                <a href="#" className="text-indigo-600 hover:underline">利用規約</a>
                と
                <a href="#" className="text-indigo-600 hover:underline">プライバシーポリシー</a>
                に同意したものとみなされます。
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
