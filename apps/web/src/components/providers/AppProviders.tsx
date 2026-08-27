'use client';

import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { Toaster } from '@/components/ui/toast';
import { SmoothScrollProvider } from './SmoothScrollProvider';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getMeApi, refreshTokenApi } from '@/features/auth/api/auth.api';
import { HttpError } from '@/lib/api-client';

function hasAuthCookie(): boolean {
  if (typeof document === 'undefined') return false;
  const cookies = document.cookie;
  return (
    cookies.includes('user_logged_in=') ||
    cookies.includes('refreshToken=') ||
    cookies.includes('admin_token=')
  );
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

  const { setAccessToken, setAuthenticated, setLoading, logout } = useAuthStore();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    // Không có cookie xác thực -> Khách vãng lai, dừng ngay không phát sinh request
    if (!hasAuthCookie()) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function initAuth() {
      try {
        const refreshData = await refreshTokenApi();
        const { accessToken } = refreshData?.data || {};

        if (accessToken) {
          if (!isMounted) return;
          setAccessToken(accessToken);

          const me = await getMeApi();

          if (!isMounted) return;
          setAuthenticated(accessToken, me.data);
        } else {
          if (!isMounted) return;
          logout();
        }
      } catch (error) {
        if (!(error instanceof HttpError && error.status === 401)) {
          console.warn('Silent auth refresh error:', error);
        }
        if (isMounted) {
          logout();
        }
      }
    }

    void initAuth();

    return () => {
      isMounted = false;
    };
  }, [setAccessToken, setAuthenticated, setLoading, logout]);

  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'placeholder-id';

  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <SmoothScrollProvider>
          {children}
          <Toaster />
        </SmoothScrollProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}

export default AppProviders;
