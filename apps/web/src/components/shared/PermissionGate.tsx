'use client';

import React from 'react';
import { useAuthStore } from '@/features/auth/store/authStore';

export type StaffPermissionKey =
  | 'canManageOrders'
  | 'canUpdateTailoring'
  | 'canManageInventory'
  | 'canViewReports';

interface PermissionGateProps {
  permission?: StaffPermissionKey;
  adminOnly?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({
  permission,
  adminOnly = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { user, isAdmin, isStaff } = useAuthStore();

  if (!user) return <>{fallback}</>;

  // ADMIN luôn có toàn quyền
  if (isAdmin) {
    return <>{children}</>;
  }

  // Nếu yêu cầu chỉ ADMIN
  if (adminOnly) {
    return <>{fallback}</>;
  }

  // Nếu là STAFF và cần kiểm tra quyền cụ thể
  if (isStaff) {
    if (!permission) return <>{children}</>;

    // Kiểm tra quyền từ user info nếu có
    const staffPerms = (user as any).staffPermission;
    if (staffPerms && staffPerms[permission] === false) {
      return <>{fallback}</>;
    }

    return <>{children}</>;
  }

  return <>{fallback}</>;
}
