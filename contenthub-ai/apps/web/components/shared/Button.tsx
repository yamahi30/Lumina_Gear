import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

/**
 * Apple HIG準拠のボタンコンポーネント
 * - 最小12px角丸
 * - ホバー時のスケール・リフトアニメーション
 * - アクティブ時のscale(0.95)
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          // ベーススタイル
          'inline-flex items-center justify-center font-medium',
          'transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          // ホバー・アクティブアニメーション
          'hover:scale-[1.02] hover:-translate-y-0.5',
          'active:scale-95',
          // サイズ
          size === 'sm' && 'text-sm px-3 py-1.5 rounded-xl',
          size === 'md' && 'text-sm px-4 py-2 rounded-xl',
          size === 'lg' && 'text-base px-6 py-3 rounded-2xl',
          // バリアント
          variant === 'primary' && [
            'bg-indigo-500/90 text-white',
            'hover:bg-indigo-600/90',
            'border border-indigo-400/30',
            'focus-visible:ring-indigo-500',
          ],
          variant === 'secondary' && [
            'bg-white/80 text-gray-700',
            'hover:bg-white/90',
            'border border-white/30',
            'focus-visible:ring-gray-400',
          ],
          variant === 'ghost' && [
            'bg-transparent text-gray-700',
            'hover:bg-gray-100/80',
            'focus-visible:ring-gray-400',
          ],
          variant === 'destructive' && [
            'bg-red-500/90 text-white',
            'hover:bg-red-600/90',
            'border border-red-400/30',
            'focus-visible:ring-red-500',
          ],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <>
            <LoadingSpinner className="mr-2" />
            処理中...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={cn('animate-spin h-4 w-4', className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
