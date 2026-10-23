'use client';

import React from 'react';
import { useAdminSession } from '../hooks/useAdminSession';
import { type Permission } from '../permissions';

interface PermissionGateProps {
  permission?: Permission;
  adminOnly?: boolean;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Ẩn/hiện UI theo quyền quản trị. CHỈ là lớp hiển thị — Server Action vẫn phải tự kiểm tra quyền
 * bằng `authorizeAdminAction` vì request có thể gửi thẳng mà không qua UI.
 */
export function PermissionGate({
  permission,
  adminOnly = false,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { user, isAdmin, isStaff } = useAdminSession({ force: true });

  if (!user) return <>{fallback}</>;

  // ADMIN luôn có toàn quyền
  if (isAdmin) return <>{children}</>;

  if (adminOnly) return <>{fallback}</>;

  if (isStaff && (!permission || user.permissions.includes(permission))) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
