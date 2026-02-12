'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCurrentUser } from '@/hooks/api/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * 認証が必要なページをラップするコンポーネント
 * 未認証の場合はログインページにリダイレクト
 */
export function AuthGuard({ children, redirectTo = '/login' }: AuthGuardProps) {
  const router = useRouter();
  const { data: user, isLoading, isError } = useCurrentUser();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  // ローディング中
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          <p className="text-sm text-gray-600">認証を確認中...</p>
        </div>
      </div>
    );
  }

  // 未認証
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
          <p className="text-sm text-gray-600">ログインページへリダイレクト中...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

/**
 * 認証状態を提供するコンテキスト用のラッパー
 * AuthGuardと異なり、リダイレクトせず認証状態のみ提供
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
