"use client";

import { useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getAdminSessionHint } from "@/lib/api-client";
import { getAdminSessionAction } from "../actions/session.actions";

export const ADMIN_SESSION_QUERY_KEY = ["admin-session"] as const;

const subscribeNoop = () => () => {};

/**
 * Cờ `admin_session` (do Backend đặt) cho biết trình duyệt có đang giữ phiên quản trị hay không.
 * Đọc qua useSyncExternalStore để server render và lần hydrate đầu tiên cho cùng kết quả.
 */
function useAdminSessionHint(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => Boolean(getAdminSessionHint()),
    () => false
  );
}

/**
 * Phiên Admin/Staff hiện tại — nguồn dữ liệu duy nhất cho UI quản trị và thanh công cụ admin ở storefront.
 * Thông tin lấy từ server (xác minh token + phiên + DB), không lưu localStorage.
 *
 * @param options.force Luôn hỏi server (dùng trong khu vực /admin). Mặc định chỉ hỏi khi có cờ `admin_session`.
 */
export function useAdminSession(options?: { force?: boolean }) {
  const hasHint = useAdminSessionHint();
  const enabled = Boolean(options?.force) || hasHint;

  const query = useQuery({
    queryKey: ADMIN_SESSION_QUERY_KEY,
    queryFn: () => getAdminSessionAction(),
    enabled,
    staleTime: 5 * 60 * 1000,
  });

  const user = enabled ? query.data ?? null : null;

  return {
    user,
    isLoading: enabled && query.isPending,
    isAdmin: user?.role === "ADMIN",
    isStaff: user?.role === "STAFF",
    isAdminOrStaff: Boolean(user),
    refetch: query.refetch,
  };
}

/**
 * Tiện ích cập nhật / xóa cache phiên admin sau khi đăng nhập, đăng xuất, sửa hồ sơ
 */
export function useAdminSessionCache() {
  const queryClient = useQueryClient();
  return {
    refresh: () => queryClient.invalidateQueries({ queryKey: ADMIN_SESSION_QUERY_KEY }),
    clear: () => queryClient.setQueryData(ADMIN_SESSION_QUERY_KEY, null),
    set: (user: Awaited<ReturnType<typeof getAdminSessionAction>>) =>
      queryClient.setQueryData(ADMIN_SESSION_QUERY_KEY, user),
  };
}
