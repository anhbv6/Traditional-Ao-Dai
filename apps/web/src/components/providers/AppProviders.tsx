'use client';

import React, { ReactNode, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from '@/components/ui/toast';
import { SmoothScrollProvider } from './SmoothScrollProvider';
import { useAuthStore, establishCustomerSession } from '@/features/auth';
import { rehydrateCart } from '@/features/cart';
import { hasCustomerSession, refreshBrowserToken, HttpError } from '@/lib/api-client';

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

  useEffect(() => {
    patchGsiInitialize();
    // Nạp giỏ hàng từ localStorage sau khi hydrate (store dùng skipHydration để tránh lệch SSR)
    rehydrateCart();
  }, []);

  // Khôi phục phiên KHÁCH HÀNG một lần khi tải ứng dụng:
  // chỉ gọi refresh khi Backend đã đặt cờ `has_session` (khách vãng lai không phát sinh request thừa).
  // Phiên Admin/Staff được quản lý riêng bằng useAdminSession (đọc từ server), không xử lý ở đây.
  useEffect(() => {
    const { setLoading, logout } = useAuthStore.getState();

    if (!hasCustomerSession()) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    (async () => {
      try {
        const accessToken = await refreshBrowserToken();
        if (!isMounted) return;

        if (accessToken) {
          await establishCustomerSession(accessToken);
        } else {
          logout();
        }
      } catch (error) {
        if (!(error instanceof HttpError && error.status === 401)) {
          console.warn('Silent auth refresh error:', error);
        }
        if (isMounted) logout();
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

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
