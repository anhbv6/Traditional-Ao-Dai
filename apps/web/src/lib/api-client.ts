import { AUTH_COOKIES } from '@repo/shared';

/**
 * HTTP client dùng chung cho toàn bộ Frontend.
 *
 * - Trình duyệt gọi đường dẫn tương đối `/api/*` (Next.js rewrites chuyển tiếp sang Express -> cùng origin).
 * - Server (RSC / Route Handler) gọi thẳng địa chỉ nội bộ `API_INTERNAL_URL`.
 * - Tầng `lib` KHÔNG import từ `features/*`: phần trạng thái đăng nhập được feature auth đăng ký qua `configureApiClient`.
 * - KHÔNG đọc/ghi cookie phiên ở đây — cookie do Backend đặt (httpOnly), client chỉ đọc cờ `has_session`.
 */

const BROWSER_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const SERVER_BASE_URL = `${(process.env.API_INTERNAL_URL || 'http://127.0.0.1:3001').replace(/\/$/, '')}/api`;

type CustomRequestInit = Omit<RequestInit, 'body'> & {
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  retryOnUnauthorized?: boolean;
  skipAuth?: boolean;
};

export class HttpError extends Error {
  status: number;
  payload: unknown;
  constructor({ status, payload }: { status: number; payload: unknown }) {
    super(`HTTP Error: ${status}`);
    this.status = status;
    this.payload = payload;
  }
}

// ─── Auth handlers (đăng ký bởi feature auth) ──────────────────────────────────

export interface ApiClientAuthHandlers {
  /** Access token khách hàng đang giữ trong bộ nhớ */
  getAccessToken: () => string | null;
  /** Lưu access token mới sau khi refresh thành công */
  onAccessTokenRefreshed: (accessToken: string) => void;
  /** Refresh thất bại -> xóa trạng thái đăng nhập phía client */
  onSessionExpired: () => void;
}

let authHandlers: ApiClientAuthHandlers | null = null;

export function configureApiClient(handlers: ApiClientAuthHandlers) {
  authHandlers = handlers;
}

function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

/** Khách hàng đang có phiên (dựa vào cờ `has_session` do Backend đặt) */
export function hasCustomerSession(): boolean {
  return Boolean(readCookie(AUTH_COOKIES.customerSessionHint));
}

/** Admin/Staff đang có phiên — chỉ dùng cho UI (vai trò thật được xác minh ở server) */
export function getAdminSessionHint(): string | undefined {
  return readCookie(AUTH_COOKIES.adminSessionHint);
}

function getLocalePrefix(pathname: string) {
  const first = pathname.split('/').filter(Boolean)[0];
  return first === 'vi' || first === 'en' ? first : 'vi';
}

/**
 * Hết phiên ở trang yêu cầu đăng nhập -> chuyển về trang đăng nhập tương ứng
 */
function redirectToLoginAfterSessionExpired() {
  if (typeof window === 'undefined') return;

  const { pathname } = window.location;
  const locale = getLocalePrefix(pathname);
  const isProfileRoute = pathname.split('/').filter(Boolean).includes('profile');
  if (!isProfileRoute) return;

  const loginPath = `/${locale}/login`;
  if (pathname === loginPath) return;

  window.sessionStorage.setItem('auth:session-expired', 'true');
  window.location.assign(`${loginPath}?redirect=${encodeURIComponent(pathname)}`);
}

/**
 * Chuẩn hóa URL: chấp nhận cả '/api/auth/login' lẫn '/auth/login'
 */
function buildFullUrl(url: string, queryString: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `${url}${queryString}`;
  }

  const [cleanUrl, inlineQuery] = url.split('?');

  let path = cleanUrl;
  if (path.startsWith('/api/')) {
    path = path.slice(4);
  } else if (path === '/api') {
    path = '';
  } else if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  const rawBase = typeof window === 'undefined' ? SERVER_BASE_URL : BROWSER_BASE_URL;
  const base = rawBase.endsWith('/') ? rawBase.slice(0, -1) : rawBase;

  let finalQuery = '';
  if (inlineQuery && queryString) {
    finalQuery = `?${inlineQuery}&${queryString.replace(/^\?/, '')}`;
  } else if (inlineQuery) {
    finalQuery = `?${inlineQuery}`;
  } else if (queryString) {
    finalQuery = queryString.startsWith('?') ? queryString : `?${queryString}`;
  }

  return `${base}${path}${finalQuery}`;
}

// Single-flight: nhiều request cùng gặp 401 chỉ gọi refresh một lần
let refreshTokenPromise: Promise<string | undefined> | null = null;

/**
 * Làm mới access token khách hàng bằng refresh token (cookie httpOnly do Backend quản lý)
 */
export const refreshBrowserToken = async (): Promise<string | undefined> => {
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = (async () => {
    try {
      const res = await fetch(buildFullUrl('/auth/refresh-token', ''), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      const isJson = res.headers.get('content-type')?.includes('application/json');
      const payload = (isJson ? await res.json() : await res.text()) as { data?: { accessToken?: string } } | string;
      const accessToken = typeof payload === 'object' ? payload.data?.accessToken : undefined;

      if (!res.ok || !accessToken) {
        authHandlers?.onSessionExpired();
        redirectToLoginAfterSessionExpired();
        if (!res.ok) {
          throw new HttpError({ status: res.status, payload });
        }
        return undefined;
      }

      authHandlers?.onAccessTokenRefreshed(accessToken);
      return accessToken;
    } finally {
      refreshTokenPromise = null;
    }
  })();

  return refreshTokenPromise;
};

/**
 * Hàm gửi HTTP Request tổng quát
 */
const request = async <ResponseData>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
  url: string,
  options?: CustomRequestInit
): Promise<ResponseData> => {
  let body: BodyInit | null | undefined = undefined;
  let headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options?.body) {
    if (options.body instanceof FormData) {
      body = options.body;
      headers = {}; // Trình duyệt tự set Content-Type và boundary cho FormData
    } else {
      body = JSON.stringify(options.body);
    }
  }

  // Xử lý Query Parameters
  let queryString = '';
  if (options?.params) {
    const searchParams = new URLSearchParams();
    Object.entries(options.params).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        searchParams.append(key, String(val));
      }
    });
    queryString = `?${searchParams.toString()}`;
  }

  // Đính kèm Bearer Token từ Zustand Store
  let token: string | undefined;
  const isServer = typeof window === 'undefined';

  if (!options?.skipAuth && !isServer) {
    token = authHandlers?.getAccessToken() || undefined;
  }

  if (token) {
    headers = {
      ...headers,
      Authorization: `Bearer ${token}`,
    };
  }

  const fullUrl = buildFullUrl(url, queryString);

  const res = await fetch(fullUrl, {
    ...options,
    method,
    credentials: 'include',
    headers: {
      ...headers,
      ...options?.headers,
    },
    body,
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = (isJson ? await res.json() : await res.text()) as unknown;

  // Tự động làm mới Access Token khi gặp 401 (Chỉ retry nếu có phiên hoặc chưa bị cấm retry)
  if (
    !res.ok &&
    res.status === 401 &&
    !isServer &&
    options?.retryOnUnauthorized !== false &&
    !options?.skipAuth &&
    hasCustomerSession()
  ) {
    try {
      const nextAccessToken = await refreshBrowserToken();
      if (nextAccessToken) {
        return request<ResponseData>(method, url, {
          ...options,
          retryOnUnauthorized: false,
          headers: {
            ...options?.headers,
            Authorization: `Bearer ${nextAccessToken}`,
          },
        });
      }
    } catch {
      // Refresh token failed -> Rơi xuống throw HttpError bên dưới
    }
  }

  if (!res.ok) {
    throw new HttpError({
      status: res.status,
      payload,
    });
  }

  return payload as ResponseData;
};

export const apiClient = {
  get: <T>(url: string, options?: Omit<CustomRequestInit, 'body'>) =>
    request<T>('GET', url, options),
  post: <T>(url: string, body: unknown, options?: Omit<CustomRequestInit, 'body'>) =>
    request<T>('POST', url, { ...options, body }),
  put: <T>(url: string, body: unknown, options?: Omit<CustomRequestInit, 'body'>) =>
    request<T>('PUT', url, { ...options, body }),
  delete: <T>(url: string, options?: Omit<CustomRequestInit, 'body'>) =>
    request<T>('DELETE', url, options),
  patch: <T>(url: string, body: unknown, options?: Omit<CustomRequestInit, 'body'>) =>
    request<T>('PATCH', url, { ...options, body }),
};
