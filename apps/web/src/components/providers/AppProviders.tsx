'use client';

import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from '@/components/ui/toast';
import { SmoothScrollProvider } from './SmoothScrollProvider';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getMeApi } from '@/features/auth/api/auth.api';
import {
  clearCustomerAuth,
  clearAdminAuth,
  clearBrowserAuthTokens,
  refreshBrowserToken,
  HttpError,
} from '@/lib/api-client';

function hasAuthCookie(): boolean {
  if (typeof document === 'undefined') return false;
  const cookies = document.cookie;
  return (
    cookies.includes('user_logged_in=') ||
    cookies.includes('refreshToken=') ||
    cookies.includes('admin_token=')
  );
}

interface GoogleAccountsId {
  initialize: (config: Record<string, unknown>) => void;
  [key: string]: unknown;
}

/**
 * Ngăn chặn cảnh báo [GSI_LOGGER] khi google.accounts.id.initialize() bị gọi nhiều lần do
 * React StrictMode, Next.js page navigation hoặc re-renders của @react-oauth/google.
 * Giữ nguyên callback mới nhất từ component con mà chỉ khởi tạo Google SDK một lần duy nhất.
 */
function patchGsiInitialize() {
  if (typeof window === 'undefined') return;

  const accountsId = (window as unknown as { google?: { accounts?: { id?: GoogleAccountsId } } })?.google?.accounts?.id;
  if (!accountsId || (accountsId.initialize as { __isPatched?: boolean }).__isPatched) return;

  const originalInitialize = accountsId.initialize;

  const patchedInitialize = function (config: Record<string, unknown>) {
    (window as unknown as { __gsi_active_callback?: ((res: unknown) => void) | null }).__gsi_active_callback =
      typeof config?.callback === 'function' ? (config.callback as (res: unknown) => void) : null;

    const win = window as unknown as { __gsi_initialized?: boolean };
    if (!win.__gsi_initialized) {
      win.__gsi_initialized = true;
      originalInitialize.call(accountsId, {
        ...config,
        callback: (response: unknown) => {
          (window as unknown as { __gsi_active_callback?: ((res: unknown) => void) | null }).__gsi_active_callback?.(response);
        },
      });
    }
  };

  (patchedInitialize as { __isPatched?: boolean }).__isPatched = true;
  accountsId.initialize = patchedInitialize;
}

export function AppProviders({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
            retry: false,
          },
        },
      })
  );

  const { isAuthenticated, user, isCustomer, setAccessToken, setAuthenticated, setLoading, logout } = useAuthStore();
  const isInitialized = useRef(false);
  const isSyncing = useRef(false);

  useEffect(() => {
    patchGsiInitialize();
  }, []);

  useEffect(() => {
    const cookies = typeof document !== 'undefined' ? document.cookie : '';
    const hasAdminToken = cookies.includes('admin_token=');
    const hasCustomerSession = cookies.includes('user_logged_in=') || cookies.includes('refreshToken=');
    const isAdminPath = pathname?.includes('/admin') ?? false;

    // Không có bất kỳ cookie xác thực nào -> Khách vãng lai, dừng ngay không phát sinh request
    if (!hasAdminToken && !hasCustomerSession) {
      if (!isInitialized.current) {
        isInitialized.current = true;
        setLoading(false);
      }
      return;
    }

    // Kiểm tra xem có cần đồng bộ lại phiên giữa Admin và Customer không:
    // 1. Lần tải trang đầu tiên (initial load)
    // 2. Chuyển từ admin/login về storefront và phiên Customer trong cookie chưa được nạp vào Zustand
    const needCustomerRestore = !isAdminPath && !isAuthenticated && hasCustomerSession;
    // 3. Chuyển từ storefront vào admin và cần nạp lại phiên Admin
    const needAdminRestore = isAdminPath && (!isAuthenticated || isCustomer) && hasAdminToken;
    // 4. Admin vừa đăng xuất, quay lại storefront và phiên Customer vẫn còn hiệu lực
    const needSwitchToCustomer = !isAdminPath && !isCustomer && !hasAdminToken && hasCustomerSession;

    const shouldSync = !isInitialized.current || needCustomerRestore || needAdminRestore || needSwitchToCustomer;

    if (!shouldSync || isSyncing.current) {
      return;
    }

    isInitialized.current = true;
    isSyncing.current = true;

    let isMounted = true;

    async function initAuth() {
      try {
        // 1. Phục hồi phiên làm việc cho Quản trị viên (Admin / Staff) - Tuyệt đối không gọi api /me theo quy ước dự án
        if (hasAdminToken && (isAdminPath || !hasCustomerSession)) {
          const match = cookies.match(/admin_token=([^;]+)/);
          const adminToken = match ? decodeURIComponent(match[1]) : null;

          if (adminToken) {
            setAccessToken(adminToken);
            if (typeof window !== 'undefined') {
              try {
                const cachedAdmin = localStorage.getItem('admin_user');
                if (cachedAdmin) {
                  const parsedUser = JSON.parse(cachedAdmin);
                  if (isMounted && parsedUser) {
                    setAuthenticated(adminToken, parsedUser);
                    return;
                  }
                }
              } catch (err) {
                console.warn('Lỗi khôi phục admin_user từ localStorage:', err);
              }
            }
          }
          if (isAdminPath) return;
        }

        // 2. Phục hồi phiên làm việc cho Khách hàng (Customer) qua Refresh Token (Chỉ chạy ở Storefront)
        if (!isAdminPath && hasCustomerSession) {
          const accessToken = await refreshBrowserToken();

          if (accessToken) {
            if (!isMounted) return;
            const me = await getMeApi();

            if (!isMounted) return;
            setAuthenticated(accessToken, me.data);
          } else {
            if (!isMounted) return;
            clearCustomerAuth();
            logout();
          }
        }
      } catch (error) {
        if (!(error instanceof HttpError && error.status === 401)) {
          console.warn('Silent auth refresh error:', error);
        }
        if (isMounted) {
          clearCustomerAuth();
          logout();
        }
      } finally {
        isSyncing.current = false;
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void initAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, isAuthenticated, isCustomer, setAccessToken, setAuthenticated, setLoading, logout]);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'placeholder-id';

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={googleClientId} onScriptLoadSuccess={patchGsiInitialize}>
        <SmoothScrollProvider>
          {children}
          <Toaster />
        </SmoothScrollProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;
