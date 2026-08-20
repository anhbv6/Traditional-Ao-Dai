import { useAuthStore } from '@/features/auth/store/authStore';

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

const clearBrowserAuth = () => {
  useAuthStore.getState().logout();
};

export const clearBrowserAuthTokens = clearBrowserAuth;

const getLoginPath = () => {
  if (typeof window === 'undefined') {
    return '/login';
  }

  const locale = window.location.pathname.split('/')[1];
  return locale === 'vi' || locale === 'en' ? `/${locale}/login` : '/login';
};

const redirectToLoginAfterSessionExpired = () => {
  if (typeof window === 'undefined') {
    return;
  }

  const loginPath = getLoginPath();
  if (window.location.pathname === loginPath) {
    return;
  }

  window.sessionStorage.setItem('auth:session-expired', 'true');
  window.location.assign(loginPath);
};

const refreshBrowserToken = async (): Promise<string | undefined> => {
  const res = await fetch('/api/auth/refresh', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = (isJson ? await res.json() : await res.text()) as { data?: { accessToken?: string } } | string;

  if (!res.ok) {
    clearBrowserAuth();
    redirectToLoginAfterSessionExpired();
    throw new HttpError({
      status: res.status,
      payload,
    });
  }

  if (typeof payload === 'string') {
    clearBrowserAuth();
    redirectToLoginAfterSessionExpired();
    throw new HttpError({
      status: res.status,
      payload,
    });
  }

  const accessToken = payload.data?.accessToken;
  if (!accessToken) {
    clearBrowserAuth();
    redirectToLoginAfterSessionExpired();
    return undefined;
  }

  useAuthStore.getState().setAccessToken(accessToken);
  return accessToken;
};

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
      headers = {}; // Let browser set boundary automatically for FormData
    } else {
      body = JSON.stringify(options.body);
    }
  }

  // Handle Query Parameters
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

  // Dynamic Token Retrieval based on Environment (Server vs Client)
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

  // Combine URLs
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  const fullUrl = `${cleanUrl}${queryString}`;

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

  if (!res.ok && res.status === 401 && !isServer && options?.retryOnUnauthorized !== false) {
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
  }

  if (!res.ok) {
    if (
      res.status === 401 &&
      !isServer &&
      cleanUrl === '/api/auth/refresh' &&
      options?.redirectOnUnauthorized !== false
    ) {
      clearBrowserAuth();
      redirectToLoginAfterSessionExpired();
    }

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

export function getErrorMessage(err: unknown, fallback: string): string {
  const payload = err instanceof HttpError ? err.payload : undefined;

  if (payload && typeof payload === 'object') {
    if ('errors' in payload && Array.isArray(payload.errors) && payload.errors.length > 0) {
      return payload.errors
        .map((e: any) => e.message || 'Lỗi không xác định')
        .join(', ');
    }
    if ('message' in payload) {
      return String(payload.message);
    }
  }

  if (err instanceof Error) {
    return err.message;
  }

  return fallback;
}
