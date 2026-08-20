'use client';

import React, { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuthStore } from '@/features/auth/store/authStore';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';

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
    return <LoadingOverlay visible={true} />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (adminOnly && user?.role !== 'ADMIN') {
    return null;
  }

  return <>{children}</>;
}
