'use client';

import React, { useEffect, useRef } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getMeApi, refreshTokenApi } from '@/features/auth/api/auth.api';
import { usePathname, useRouter } from '@/i18n/routing';
import { HttpError } from '@/lib/api-client';

const PUBLIC_AUTH_ROUTES = new Set([
  '/login',
  '/signin',
  '/forgot',
  '/changePassword',
  '/admin/login',
]);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setAccessToken, setAuthenticated, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const isInitialized = useRef(false);

  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    let isMounted = true;

    async function initAuth() {
      try {
        const refreshData = await refreshTokenApi();
        const { accessToken } = refreshData.data;

        if (accessToken) {
          if (!isMounted) return;
          setAccessToken(accessToken);

          const me = await getMeApi();

          if (!isMounted) return;
          setAuthenticated(accessToken, me.data);

          if (PUBLIC_AUTH_ROUTES.has(pathname)) {
            router.replace('/');
          }
        } else {
          if (!isMounted) return;
          logout();
        }
      } catch (error) {
        if (!(error instanceof HttpError && error.status === 401)) {
          console.error('Authentication initialization failed:', error);
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
  }, [pathname, router, setAccessToken, setAuthenticated, logout]);

  return <>{children}</>;
}
