const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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

type TokenPair = {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt?: string;
};

type RefreshTokenPayload = {
  data: TokenPair & {
    user?: unknown;
  };
};

const ACCESS_TOKEN_COOKIE_MAX_AGE = 60 * 15;
const REFRESH_TOKEN_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

const setCookie = (name: string, value: string, maxAge: number) => {
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
};

const secondsUntil = (dateValue?: string) => {
  if (!dateValue) {
    return REFRESH_TOKEN_COOKIE_MAX_AGE;
  }

  const expiresAt = new Date(dateValue).getTime();
  if (Number.isNaN(expiresAt)) {
    return REFRESH_TOKEN_COOKIE_MAX_AGE;
  }

  return Math.max(0, Math.floor((expiresAt - Date.now()) / 1000));
};

const clearBrowserAuth = () => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userInfo');
  document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
  document.cookie = 'refreshToken=; path=/; max-age=0; SameSite=Lax';
  window.dispatchEvent(new Event('auth-storage-change'));
};

export const clearBrowserAuthTokens = clearBrowserAuth;

export const setBrowserAuthTokens = ({ accessToken, refreshToken, refreshTokenExpiresAt }: TokenPair) => {
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
  setCookie('accessToken', accessToken, ACCESS_TOKEN_COOKIE_MAX_AGE);
  setCookie('refreshToken', refreshToken, secondsUntil(refreshTokenExpiresAt));
  window.dispatchEvent(new Event('auth-storage-change'));
};

const refreshBrowserToken = async (): Promise<string | undefined> => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) {
    return undefined;
  }

  const res = await fetch(`${BASE_URL}/auth/client/refresh-token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const payload = (isJson ? await res.json() : await res.text()) as RefreshTokenPayload | string;

  if (!res.ok) {
    clearBrowserAuth();
    throw new HttpError({
      status: res.status,
      payload,
    });
  }

  if (typeof payload === 'string') {
    clearBrowserAuth();
    throw new HttpError({
      status: res.status,
      payload,
    });
  }

  const tokens = payload.data;
  setBrowserAuthTokens(tokens);

  if (payload.data?.user) {
    localStorage.setItem('userInfo', JSON.stringify(payload.data.user));
  }

  return tokens.accessToken;
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

  if (!options?.skipAuth && isServer) {
    try {
      const { cookies } = await import('next/headers');
      const cookieStore = await cookies();
      token = cookieStore.get('accessToken')?.value;
    } catch (e) {
      console.warn('Failed to retrieve cookies in server context:', e);
    }
  } else if (!options?.skipAuth) {
    token = localStorage.getItem('accessToken') || undefined;
  }

  if (token) {
    headers = {
      ...headers,
      Authorization: `Bearer ${token}`,
    };
  }

  // Combine URLs
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  const fullUrl = `${BASE_URL}${cleanUrl}${queryString}`;

  const res = await fetch(fullUrl, {
    ...options,
    method,
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
