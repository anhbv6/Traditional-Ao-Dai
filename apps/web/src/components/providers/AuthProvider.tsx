'use client';

import React, { useEffect } from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getMeApi, refreshTokenApi } from '@/features/auth/api/auth.api';
import { usePathname } from '@/i18n/routing';

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

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      if (PUBLIC_AUTH_ROUTES.has(pathname)) {
        logout();
        return;
      }

      try {
        const refreshData = await refreshTokenApi();
        const { accessToken } = refreshData.data;

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
        console.error('Authentication initialization failed:', error);
        if (isMounted) {
          logout();
        }
      }
    }

    void initAuth();

    return () => {
      isMounted = false;
    };
  }, [pathname, setAccessToken, setAuthenticated, logout]);

  return <>{children}</>;
}
