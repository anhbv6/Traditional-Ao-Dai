'use client';

import React, { useEffect } from 'react';
import { useRouter } from '@/i18n/routing';
import { useAuthStore } from '@/features/auth/store/authStore';
import { LoadingOverlay } from '@/components/shared/LoadingOverlay';

type Role = 'ADMIN' | 'STAFF' | 'CUSTOMER';

type ProtectedRouteProps = {
  children: React.ReactNode;
  adminOnly?: boolean;
  allowedRoles?: Role[];
};

export function ProtectedRoute({
  children,
  adminOnly = false,
  allowedRoles,
}: ProtectedRouteProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuthStore();

  const effectiveRoles: Role[] = allowedRoles || (adminOnly ? ['ADMIN', 'STAFF'] : ['ADMIN', 'STAFF', 'CUSTOMER']);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace(adminOnly ? '/admin/login' : '/login');
      } else if (user && !effectiveRoles.includes(user.role as Role)) {
        router.replace('/403');
      }
    }
  }, [isLoading, isAuthenticated, user, adminOnly, effectiveRoles, router]);

  if (isLoading) {
    return <LoadingOverlay visible={true} />;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (user && !effectiveRoles.includes(user.role as Role)) {
    return null;
  }

  return <>{children}</>;
}
