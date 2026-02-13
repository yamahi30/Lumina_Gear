'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Menu, X, LogOut, User, Settings } from 'lucide-react';
import { useState } from 'react';
import { useCurrentUser, useLogout } from '@/hooks/api/useAuth';

export function Header() {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user, isLoading } = useCurrentUser();
  const logoutMutation = useLogout();

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/80 border-b border-white/20">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        {/* ロゴ */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">
            ContentHub AI
          </span>
        </Link>

        {/* デスクトップナビゲーション */}
        <nav className="hidden md:flex items-center gap-6">
          <NavLink href="/dashboard">ダッシュボード</NavLink>
          <NavLink href="/calendar">カレンダー</NavLink>
          <NavLink href="/posts">投稿作成</NavLink>
          <NavLink href="/notes">記事作成</NavLink>
          <NavLink href="/style">文体構造学習</NavLink>
          <NavLink href="/settings">設定</NavLink>
        </nav>

        {/* ユーザーメニュー（デスクトップ） */}
        <div className="hidden md:flex items-center gap-4">
          {isLoading ? (
            <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-3">
              {/* ユーザーアバター */}
              {user.picture ? (
                <Image
                  src={user.picture}
                  alt={user.name}
                  width={32}
                  height={32}
                  className="rounded-full border border-gray-200"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-indigo-600" />
                </div>
              )}
              <span className="text-sm text-gray-700">{user.name}</span>
              <button
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm text-gray-600
                           hover:bg-gray-100/80 hover:text-gray-900
                           transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-500/90 px-4 py-2 text-sm text-white font-medium
                         hover:bg-indigo-600/90 hover:scale-[1.02]
                         active:scale-95 transition-all duration-200
                         border border-indigo-400/30"
            >
              ログイン
            </Link>
          )}
        </div>

        {/* モバイルメニューボタン */}
        <button
          className="md:hidden p-2 rounded-xl hover:bg-gray-100/80 transition-colors"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="メニュー"
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* モバイルメニュー */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-white/95 backdrop-blur-xl border-b border-white/20">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-2">
            <MobileNavLink href="/dashboard" onClick={() => setIsMenuOpen(false)}>
              ダッシュボード
            </MobileNavLink>
            <MobileNavLink href="/calendar" onClick={() => setIsMenuOpen(false)}>
              カレンダー
            </MobileNavLink>
            <MobileNavLink href="/posts" onClick={() => setIsMenuOpen(false)}>
              投稿作成
            </MobileNavLink>
            <MobileNavLink href="/notes" onClick={() => setIsMenuOpen(false)}>
              記事作成
            </MobileNavLink>
            <MobileNavLink href="/style" onClick={() => setIsMenuOpen(false)}>
              文体構造学習
            </MobileNavLink>
            <MobileNavLink href="/settings" onClick={() => setIsMenuOpen(false)}>
              設定
            </MobileNavLink>
            <hr className="my-2 border-gray-200/50" />
            {user ? (
              <>
                <div className="px-4 py-3 flex items-center gap-3">
                  {user.picture ? (
                    <Image
                      src={user.picture}
                      alt={user.name}
                      width={32}
                      height={32}
                      className="rounded-full border border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                  )}
                  <span className="text-sm text-gray-700">{user.name}</span>
                </div>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMenuOpen(false);
                  }}
                  className="px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100/80 transition-colors text-left flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  ログアウト
                </button>
              </>
            ) : (
              <MobileNavLink href="/login" onClick={() => setIsMenuOpen(false)}>
                ログイン
              </MobileNavLink>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
    >
      {children}
    </Link>
  );
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100/80 transition-colors"
    >
      {children}
    </Link>
  );
}
