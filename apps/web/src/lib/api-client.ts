import { useAuthStore } from '@/features/auth/store/authStore';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

type CustomRequestInit = Omit<RequestInit, 'body'> & {
  body?: unknown;
  params?: Record<string, string | number | boolean>;
  retryOnUnauthorized?: boolean;
  redirectOnUnauthorized?: boolean;
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

/**
 * Xóa trạng thái đăng nhập Khách hàng trên trình duyệt
 */
export const clearCustomerAuth = () => {
  useAuthStore.getState().logout();
  if (typeof document !== 'undefined') {
    document.cookie = 'user_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    const roleMatch = document.cookie.match(/auth_role=([^;]+)/);
    if (roleMatch && decodeURIComponent(roleMatch[1]) === 'CUSTOMER') {
      document.cookie = 'auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    }
  }
};

/**
 * Xóa trạng thái đăng nhập Quản trị viên (Admin/Staff) trên trình duyệt
 */
export const clearAdminAuth = () => {
  useAuthStore.getState().logout();
  if (typeof document !== 'undefined') {
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }
};

/**
 * Xóa toàn bộ trạng thái đăng nhập trên trình duyệt
 */
export const clearBrowserAuth = () => {
  useAuthStore.getState().logout();
  if (typeof document !== 'undefined') {
    document.cookie = 'user_logged_in=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'admin_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    document.cookie = 'auth_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
  }
};

export const clearBrowserAuthTokens = clearBrowserAuth;

/**
 * Kiểm tra xem người dùng có từng có phiên đăng nhập hay không
 */
const hasActiveAuthSession = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hasToken = Boolean(useAuthStore.getState().accessToken);
  const cookies = document.cookie || '';
  const hasUserCookie = cookies.includes('user_logged_in=') || cookies.includes('refreshToken=');
  const hasAdminCookie = cookies.includes('admin_token=');
  return hasToken || hasUserCookie || hasAdminCookie;
};

/**
 * Kiểm tra xem đường dẫn hiện tại có phải là trang yêu cầu bắt buộc đăng nhập không
 */
const isCurrentRouteProtected = (): boolean => {
  if (typeof window === 'undefined') return false;
  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  const isLocale = first === 'vi' || first === 'en';
  const pathWithoutLocale = isLocale ? `/${segments.slice(1).join('/')}` : pathname;

  return (
    pathWithoutLocale === '/admin' ||
    pathWithoutLocale.startsWith('/admin/') ||
    pathWithoutLocale === '/profile' ||
    pathWithoutLocale.startsWith('/profile/')
  );
};

/**
 * Xác định trang Login tương ứng theo ngữ cảnh (Admin vs Customer)
 */
const getLoginPath = (): string => {
  if (typeof window === 'undefined') {
    return '/login';
  }

  const pathname = window.location.pathname;
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  const locale = first === 'vi' || first === 'en' ? first : 'vi';
  const pathWithoutLocale = first === 'vi' || first === 'en' ? `/${segments.slice(1).join('/')}` : pathname;

  // Nếu đang ở khu vực quản trị Admin -> Chuyển về /admin/login
  if (pathWithoutLocale === '/admin' || pathWithoutLocale.startsWith('/admin/')) {
    return `/${locale}/admin/login`;
  }

  // Khách hàng thông thường -> Chuyển về /login
  return `/${locale}/login`;
};

/**
 * Chuyển hướng khi hết hạn phiên đăng nhập (Chỉ chuyển hướng khi thực sự cần thiết)
 */
const redirectToLoginAfterSessionExpired = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const loginPath = getLoginPath();
  if (window.location.pathname === loginPath) {
    return;
  }

  // CHỈ chuyển hướng nếu người dùng đang ở trang bảo vệ HOẶC trước đó đã từng có phiên đăng nhập
  // Không làm gián đoạn trải nghiệm của khách vãng lai đang xem hàng công khai
  if (isCurrentRouteProtected() || hasActiveAuthSession()) {
    window.sessionStorage.setItem('auth:session-expired', 'true');
    window.location.assign(loginPath);
  }
};

/**
 * Chuẩn hóa URL gọi trực tiếp tới Backend REST API
 */
function buildFullUrl(url: string, queryString: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return `${url}${queryString}`;
  }

  // Tách query params có sẵn trong URL nếu có (ví dụ: '/api/upload?folder=general')
  const [cleanUrl, inlineQuery] = url.split('?');

  // Chuẩn hóa đường dẫn: loại bỏ tiền tố /api trùng lặp với BASE_URL
  let path = cleanUrl;
  if (path.startsWith('/api/')) {
    path = path.slice(4);
  } else if (path === '/api') {
    path = '';
  } else if (!path.startsWith('/')) {
    path = `/${path}`;
  }

  // Tương thích các endpoint đặc biệt
  if (path === '/auth/refresh') {
    path = '/auth/refresh-token';
  }

  const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;

  // Ghép nối query strings nếu có
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

// Biến lưu giữ Promise refresh token đơn nhất (Single-Flight Mutex chống Race Condition)
let refreshTokenPromise: Promise<string | undefined> | null = null;

export const refreshBrowserToken = async (): Promise<string | undefined> => {
  // Nếu đang có một request refresh token khác chạy dở dang, cùng chờ kết quả chung
  if (refreshTokenPromise) {
    return refreshTokenPromise;
  }

  refreshTokenPromise = (async () => {
    try {
      const refreshUrl = buildFullUrl('/auth/refresh-token', '');
      const res = await fetch(refreshUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const isJson = res.headers.get('content-type')?.includes('application/json');
      const payload = (isJson ? await res.json() : await res.text()) as
        | { data?: { accessToken?: string } }
        | string;

      if (!res.ok) {
        clearCustomerAuth();
        redirectToLoginAfterSessionExpired();
        throw new HttpError({
          status: res.status,
          payload,
        });
      }

      if (typeof payload === 'string') {
        clearCustomerAuth();
        redirectToLoginAfterSessionExpired();
        throw new HttpError({
          status: res.status,
          payload,
        });
      }

      const accessToken = payload.data?.accessToken;
      if (!accessToken) {
        clearCustomerAuth();
        redirectToLoginAfterSessionExpired();
        return undefined;
      }

      useAuthStore.getState().setAccessToken(accessToken);
      return accessToken;
    } finally {
      // Giải phóng lock sau khi hoàn tất
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
    token = useAuthStore.getState().accessToken || undefined;
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
    hasActiveAuthSession()
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

/**
 * Bộ mã khóa lỗi chuẩn hóa cho toàn bộ hệ thống (i18n Error Keys)
 */
export const ERROR_KEYS = {
  DEFAULT_ERROR: 'DEFAULT_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  HTTP_400: 'HTTP_400',
  HTTP_401: 'HTTP_401',
  HTTP_403: 'HTTP_403',
  HTTP_404: 'HTTP_404',
  HTTP_409: 'HTTP_409',
  HTTP_422: 'HTTP_422',
  HTTP_429: 'HTTP_429',
  HTTP_500: 'HTTP_500',
  HTTP_502: 'HTTP_502',
  HTTP_503: 'HTTP_503',
  HTTP_504: 'HTTP_504',
} as const;

export type ErrorKey = (typeof ERROR_KEYS)[keyof typeof ERROR_KEYS];

/**
 * Trích xuất mã khóa lỗi i18n hoặc thông báo lỗi từ nhiều định dạng lỗi khác nhau:
 * - HttpError từ API Backend (payload: message, errors mảng hoặc object, error_description, error, detail)
 * - Lỗi kết nối mạng (AbortError -> REQUEST_TIMEOUT, Failed to fetch -> NETWORK_ERROR)
 * - Mã HTTP Status Code khi không có payload chi tiết -> HTTP_400..HTTP_504
 * - Error thông thường trong JavaScript
 * - String hoặc Plain Object lỗi
 */
export function extractErrorMessage(
  err: unknown,
  fallback: string = ERROR_KEYS.DEFAULT_ERROR
): string {
  // 1. err rỗng / falsy
  if (!err) {
    return fallback;
  }

  // 2. err là string
  if (typeof err === 'string') {
    const trimmed = err.trim();
    return trimmed.length > 0 ? trimmed : fallback;
  }

  // 3. err là HttpError hoặc đối tượng có payload / status
  if (err instanceof HttpError || (typeof err === 'object' && err !== null && ('payload' in err || 'status' in err))) {
    const httpErr = err as { status?: number; payload?: unknown };
    let payload = httpErr.payload;

    // Nếu payload là string JSON, thử parse
    if (typeof payload === 'string') {
      const trimmedPayload = payload.trim();
      if (trimmedPayload.startsWith('{') || trimmedPayload.startsWith('[')) {
        try {
          payload = JSON.parse(trimmedPayload);
        } catch {
          // Bỏ qua nếu parse thất bại
        }
      } else if (!trimmedPayload.toLowerCase().startsWith('<!doctype') && !trimmedPayload.toLowerCase().startsWith('<html')) {
        // Không phải trang HTML báo lỗi server thì trả về chuỗi text
        if (trimmedPayload.length > 0) {
          return trimmedPayload;
        }
      }
    }

    if (payload && typeof payload === 'object') {
      const p = payload as Record<string, any>;

      // 3.1. payload.errors là mảng (ví dụ Zod issues hoặc Express validator)
      if (Array.isArray(p.errors) && p.errors.length > 0) {
        const errorStrings = p.errors
          .map((item: any) => {
            if (typeof item === 'string') return item.trim();
            if (item && typeof item === 'object') {
              return item.message || item.msg || item.error || '';
            }
            return '';
          })
          .filter(Boolean);

        if (errorStrings.length > 0) {
          return errorStrings.join(', ');
        }
      }

      // 3.2. payload.errors là object/dictionary (ví dụ { email: 'Email required', password: ['Min 6 chars'] })
      if (p.errors && typeof p.errors === 'object' && !Array.isArray(p.errors)) {
        const fieldErrors = Object.values(p.errors)
          .flatMap((val: any) => (Array.isArray(val) ? val : [val]))
          .map((v: any) => (typeof v === 'string' ? v.trim() : (v?.message || '')))
          .filter(Boolean);

        if (fieldErrors.length > 0) {
          return fieldErrors.join(', ');
        }
      }

      // 3.3. payload.message (chuỗi hoặc mảng chuỗi)
      if (typeof p.message === 'string' && p.message.trim().length > 0) {
        return p.message.trim();
      }
      if (Array.isArray(p.message) && p.message.length > 0) {
        const msgs = p.message.map((m: any) => (typeof m === 'string' ? m.trim() : String(m))).filter(Boolean);
        if (msgs.length > 0) {
          return msgs.join(', ');
        }
      }

      // 3.4. payload.error_description (OAuth2 chuẩn)
      if (typeof p.error_description === 'string' && p.error_description.trim().length > 0) {
        return p.error_description.trim();
      }

      // 3.5. payload.error (chuỗi hoặc object)
      if (typeof p.error === 'string' && p.error.trim().length > 0) {
        return p.error.trim();
      }
      if (p.error && typeof p.error === 'object' && typeof p.error.message === 'string') {
        return p.error.message.trim();
      }

      // 3.6. payload.detail hoặc payload.details (RFC 7807 Problem Details)
      if (typeof p.detail === 'string' && p.detail.trim().length > 0) {
        return p.detail.trim();
      }
      if (typeof p.details === 'string' && p.details.trim().length > 0) {
        return p.details.trim();
      }
      if (Array.isArray(p.details) && p.details.length > 0) {
        const detailMsgs = p.details
          .map((d: any) => (typeof d === 'string' ? d.trim() : (d?.message || '')))
          .filter(Boolean);
        if (detailMsgs.length > 0) {
          return detailMsgs.join(', ');
        }
      }

      // 3.7. payload.data bọc lồng
      if (p.data && typeof p.data === 'object') {
        if (typeof p.data.message === 'string' && p.data.message.trim().length > 0) {
          return p.data.message.trim();
        }
        if (typeof p.data.error === 'string' && p.data.error.trim().length > 0) {
          return p.data.error.trim();
        }
      }
    }

    // 3.8. Nếu không có message trong payload nhưng có HTTP Status code:
    // Trả về i18n key chuẩn để client dịch theo ngôn ngữ tương ứng
    const isCustomFallback =
      fallback !== ERROR_KEYS.DEFAULT_ERROR &&
      fallback !== 'Đã có lỗi xảy ra, vui lòng thử lại sau.';

    if (httpErr.status && !isCustomFallback) {
      switch (httpErr.status) {
        case 400:
          return ERROR_KEYS.HTTP_400;
        case 401:
          return ERROR_KEYS.HTTP_401;
        case 403:
          return ERROR_KEYS.HTTP_403;
        case 404:
          return ERROR_KEYS.HTTP_404;
        case 409:
          return ERROR_KEYS.HTTP_409;
        case 422:
          return ERROR_KEYS.HTTP_422;
        case 429:
          return ERROR_KEYS.HTTP_429;
        case 500:
          return ERROR_KEYS.HTTP_500;
        case 502:
          return ERROR_KEYS.HTTP_502;
        case 503:
          return ERROR_KEYS.HTTP_503;
        case 504:
          return ERROR_KEYS.HTTP_504;
        default:
          return `HTTP_${httpErr.status}`;
      }
    }
  }

  // 4. Axios-like error (err.response?.data)
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const axiosData = (err as any).response?.data;
    if (axiosData) {
      const axiosMsg = extractErrorMessage(axiosData, fallback);
      if (axiosMsg && axiosMsg !== fallback) {
        return axiosMsg;
      }
    }
  }

  // 5. JavaScript Error chuẩn
  if (err instanceof Error) {
    // 5.1. Bắt lỗi mạng & Timeout -> Trả về mã i18n key
    if (err.name === 'AbortError') {
      return ERROR_KEYS.REQUEST_TIMEOUT;
    }
    const lowerMsg = err.message.toLowerCase();
    if (
      lowerMsg === 'failed to fetch' ||
      lowerMsg.includes('networkerror') ||
      lowerMsg.includes('network request failed') ||
      lowerMsg.includes('err_connection_refused')
    ) {
      return ERROR_KEYS.NETWORK_ERROR;
    }

    // 5.2. Không trả về các chuỗi kỹ thuật vô nghĩa với người dùng
    if (
      err.message &&
      !err.message.startsWith('HTTP Error:') &&
      err.message !== '[object Object]' &&
      err.message.trim().length > 0
    ) {
      return err.message.trim();
    }
  }

  // 6. Plain Object có message / error / msg
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, any>;
    if (typeof obj.message === 'string' && obj.message.trim().length > 0) {
      return obj.message.trim();
    }
    if (typeof obj.error === 'string' && obj.error.trim().length > 0) {
      return obj.error.trim();
    }
    if (typeof obj.msg === 'string' && obj.msg.trim().length > 0) {
      return obj.msg.trim();
    }
    if (typeof obj.detail === 'string' && obj.detail.trim().length > 0) {
      return obj.detail.trim();
    }
  }

  return fallback;
}

/**
 * Alias của extractErrorMessage để đảm bảo tương thích ngược 100%
 */
export const getErrorMessage = extractErrorMessage;

