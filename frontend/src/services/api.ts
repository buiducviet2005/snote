import type { User } from '../contexts/AuthContext';

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

interface SessionPayload {
  user: User;
  accessToken: string;
}
let accessToken: string | null = null;
let session: SessionPayload | null = null;
let generation = 0;
let boundary = 0;
let cookieQueue: Promise<void> = Promise.resolve();
let refreshPromise: Promise<ApiResponse<SessionPayload>> | null = null;
const listeners = new Set<() => void>();
const LOGOUT_PENDING_KEY = 'snote_logout_pending';
let logoutPending = false;

try { logoutPending = localStorage.getItem(LOGOUT_PENDING_KEY) === '1'; } catch { /* Storage may be unavailable. */ }

// Remove tokens persisted by older versions; never read or persist credentials.
try { localStorage.removeItem('snote_token'); } catch { /* Storage may be unavailable. */ }

export function getStoredToken(): string | null { return accessToken; }

export function setStoredToken(token: string | null): void {
  beginSessionChange();
  accessToken = token;
}

export function getSessionSnapshot() { return { session, boundary }; }
export function getSessionGeneration() { return generation; }
export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => { listeners.delete(listener); };
}

function publishSession(payload: SessionPayload | null) {
  if (payload && payload.user.id !== session?.user.id) boundary += 1;
  session = payload;
  accessToken = payload?.accessToken ?? null;
  listeners.forEach((listener) => listener());
}

function beginSessionChange() {
  generation += 1;
  // Anonymous auth attempts must preserve the mounted form and its validation state.
  if (session || accessToken) boundary += 1;
  refreshPromise = null;
  publishSession(null);
  return generation;
}

function assertCurrentSession(expected: number) {
  if (generation !== expected) {
    throw Object.assign(new Error('Phiên đăng nhập đã thay đổi. Vui lòng thử lại.'), {
      status: 401, code: 'SESSION_CHANGED', details: undefined
    });
  }
}

function queueCookieOperation<T>(expected: number, operation: () => Promise<T>): Promise<T> {
  // An older cookie writer must finish before the next one starts.
  const pending = cookieQueue.then(() => {
    assertCurrentSession(expected);
    return operation();
  });
  cookieQueue = pending.then(() => undefined, () => undefined);
  return pending;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.error?.message || errorBody.message || `Lỗi máy chủ (Mã: ${response.status})`;
    throw Object.assign(new Error(message), {
      status: response.status, code: errorBody.error?.code, details: errorBody.error?.details
    });
  }
  return response.json();
}

function send(path: string, options: RequestInit = {}, json = true) {
  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...(json ? { 'Content-Type': 'application/json' } : {}),
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...((options.headers as Record<string, string>) || {})
    },
    credentials: 'include'
  });
}

function markLogoutPending(pending: boolean) {
  logoutPending = pending;
  try {
    if (pending) localStorage.setItem(LOGOUT_PENDING_KEY, '1');
    else localStorage.removeItem(LOGOUT_PENDING_KEY);
  } catch { /* In-memory protection still applies when browser storage is disabled. */ }
}

async function confirmLogout<T = unknown>(expected: number): Promise<T> {
  try {
    const response = await send('/auth/logout', { method: 'POST', body: '{}' });
    const result = await parseResponse<T>(response);
    // Cookie writes are serialized, so this acknowledgment is valid even if
    // a newer login is waiting; that login has not reached the server yet.
    markLogoutPending(false);
    assertCurrentSession(expected);
    return result;
  } catch (error) {
    if ((error as { code?: string }).code === 'SESSION_CHANGED') throw error;
    throw Object.assign(new Error(
      'Chưa thể xác nhận đăng xuất với máy chủ. Vui lòng kết nối mạng và tải lại trang để thử lại trước khi đăng nhập.'
    ), { code: 'LOGOUT_NOT_CONFIRMED', status: (error as { status?: number }).status ?? 0 });
  }
}

export function bootstrapSession() {
  if (!logoutPending) return refreshSession();
  const expected = generation;
  // A pending logout must be acknowledged before this browser may recover any cookie session.
  return queueCookieOperation(expected, async () => {
    if (logoutPending) await confirmLogout(expected);
    return null;
  });
}

export function refreshSession(): Promise<ApiResponse<SessionPayload>> {
  if (!refreshPromise) {
    const expected = generation;
    const pending = queueCookieOperation(expected, async () => {
      if (logoutPending) {
        throw Object.assign(new Error('Vui lòng hoàn tất đăng xuất trước khi khôi phục phiên.'), {
          code: 'LOGOUT_NOT_CONFIRMED', status: 0
        });
      }
      const response = await send('/auth/refresh', { method: 'POST', body: '{}' });
      assertCurrentSession(expected);
      const result = await parseResponse<ApiResponse<SessionPayload>>(response);
      assertCurrentSession(expected);
      publishSession(result.data);
      return result;
    }).catch((error) => {
      if (expected === generation) beginSessionChange();
      throw error;
    }).finally(() => { if (refreshPromise === pending) refreshPromise = null; });
    refreshPromise = pending;
  }
  return refreshPromise;
}

async function changeSession<T>(path: string, options: RequestInit): Promise<T> {
  if (path === '/auth/logout') markLogoutPending(true);
  const expected = beginSessionChange();
  return queueCookieOperation(expected, async () => {
    try {
      if (path === '/auth/logout') {
        return await confirmLogout<T>(expected);
      }
      if (logoutPending) await confirmLogout(expected);
      const response = await send(path, options);
      assertCurrentSession(expected);
      const result = await parseResponse<T>(response);
      assertCurrentSession(expected);
      if (path !== '/auth/logout') publishSession((result as ApiResponse<SessionPayload>).data);
      return result;
    } finally {
      // Cancel refreshes queued during login/logout, including failed logins.
      if (expected === generation) {
        generation += 1;
        refreshPromise = null;
      }
    }
  });
}

async function authorizedResponse(path: string, options: RequestInit, json = true) {
  const expected = generation;
  const token = accessToken;
  let response = await send(path, options, json);
  assertCurrentSession(expected);
  if (response.status === 401 && token) {
    if (accessToken === token) await refreshSession();
    assertCurrentSession(expected);
    response = await send(path, options, json);
    assertCurrentSession(expected);
  }
  return { response, expected };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (options.method === 'POST') {
    if (path === '/auth/refresh') return refreshSession() as Promise<T>;
    if (['/auth/login', '/auth/register', '/auth/google', '/auth/logout'].includes(path)) {
      return changeSession<T>(path, options);
    }
  }
  const { response, expected } = await authorizedResponse(path, options);
  const result = await parseResponse<T>(response);
  assertCurrentSession(expected);
  return result;
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: any) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: any) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body?: any) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  download: async (path: string, defaultFilename: string): Promise<void> => {
    const { response, expected } = await authorizedResponse(path, { method: 'GET' }, false);
    if (!response.ok) throw new Error(`Tải tệp thất bại: ${response.statusText}`);
    const blob = await response.blob();
    assertCurrentSession(expected);
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = defaultFilename;
    document.body.appendChild(a);
    try { a.click(); } finally {
      window.URL.revokeObjectURL(blobUrl);
      document.body.removeChild(a);
    }
  }
};
