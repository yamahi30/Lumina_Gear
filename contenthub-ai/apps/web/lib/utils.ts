import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwindクラスをマージするユーティリティ関数
 * shadcn/uiで使用
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
