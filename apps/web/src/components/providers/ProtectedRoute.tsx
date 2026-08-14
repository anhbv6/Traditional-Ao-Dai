'use client';

import React, { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuthStore } from '@/features/auth/store/authStore';

type ProtectedRouteProps = {
  children: React.ReactNode;
  adminOnly?: boolean;
};

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace('/login');
      } else if (adminOnly && user?.role !== 'ADMIN') {
        router.replace('/403');
      }
    }
  }, [isLoading, isAuthenticated, user, adminOnly, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background select-none">
        <div className="flex flex-col items-center gap-4">
          {/* Loading Spinner */}
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#800020] border-t-transparent" />
          <p className="text-sm font-semibold tracking-wider text-[#800020] uppercase font-[family-name:var(--font-playfair)]">
            Đang xác thực...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (adminOnly && user?.role !== 'ADMIN') {
    return null;
  }

  return <>{children}</>;
}
