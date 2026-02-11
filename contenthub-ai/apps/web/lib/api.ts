const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

/**
 * API呼び出しエラー
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * APIリクエストを実行
 */
export async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  const data = await response.json();

  if (!response.ok || data.status === 'error') {
    throw new ApiError(
      response.status,
      data.error || 'リクエストに失敗しました'
    );
  }

  return data.data;
}

/**
 * GET リクエスト
 */
export function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST リクエスト
 */
export function apiPost<T, B = unknown>(endpoint: string, body: B): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
