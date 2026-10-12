"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { useAuthStore } from "@/features/auth";
import { useAdminSession } from "@/features/admin";
import { hasCustomerSession } from "@/lib/api-client";

interface GuestOnlyProps {
  children: ReactNode;
}

/* Cờ `has_session` không phát sự kiện khi đổi — chỉ cần đọc lúc render, nên subscribe rỗng */
const subscribeNoop = () => () => {};

/**
 * Chỉ hiển thị nội dung khi khách CHƯA đăng nhập (vd. khối Newsletter / VIP Club).
 * - Đã đăng nhập khách hàng (authStore) hoặc đang có phiên quản trị → ẩn.
 * - Đang khôi phục phiên mà trình duyệt có cờ `has_session` → ẩn trước, tránh nháy hiện rồi biến mất.
 * - Server render coi như khách vãng lai (không đọc cookie) để layout vẫn tĩnh; client tự ẩn sau khi hydrate.
 */
export function GuestOnly({ children }: GuestOnlyProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isRestoring = useAuthStore((state) => state.isLoading);
  const { user: adminUser } = useAdminSession();
  const hasSessionHint = useSyncExternalStore(subscribeNoop, hasCustomerSession, () => false);

  if (isAuthenticated || adminUser) return null;
  if (isRestoring && hasSessionHint) return null;

  return <>{children}</>;
}
