'use client';

import React, { type ReactNode, useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toast';
import { SmoothScrollProvider } from './SmoothScrollProvider';
import { useAuthStore, establishCustomerSession } from '@/features/auth';
import { rehydrateCart } from '@/features/cart';
import { rehydrateWishlist } from '@/features/wishlist';
import { hasCustomerSession, refreshBrowserToken, HttpError } from '@/lib/api-client';

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
    // Nạp giỏ hàng & danh sách yêu thích từ localStorage sau khi hydrate (store dùng skipHydration để tránh lệch SSR)
    rehydrateCart();
    rehydrateWishlist();
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

  return (
    <QueryClientProvider client={queryClient}>
      <SmoothScrollProvider>
        {children}
        <Toaster />
      </SmoothScrollProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;
