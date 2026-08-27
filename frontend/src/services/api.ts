const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api';

export interface ApiResponse<T = any> {
  success?: boolean;
  message?: string;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export function getStoredToken(): string | null {
  return localStorage.getItem('snote_token');
}

export function setStoredToken(token: string | null): void {
  if (token) {
    localStorage.setItem('snote_token', token);
  } else {
    localStorage.removeItem('snote_token');
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {})
  };

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include' // Gửi kèm cookie httpOnly
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message =
      errorBody.error?.message || errorBody.message || `Lỗi máy chủ (Mã: ${response.status})`;
    const error = new Error(message);
    (error as any).status = response.status;
    (error as any).code = errorBody.error?.code;
    (error as any).details = errorBody.error?.details;
    throw error;
  }

  return response.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: any) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: any) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: any) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  // Helper download raw blob (cho Export JSON)
  download: async (path: string, defaultFilename: string): Promise<void> => {
    const url = `${API_BASE_URL}${path}`;
    const token = getStoredToken();
    const headers: Record<string, string> = {
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    };

    const response = await fetch(url, { headers, credentials: 'include' });
    if (!response.ok) {
      throw new Error(`Tải tệp thất bại: ${response.statusText}`);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = defaultFilename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  }
};
