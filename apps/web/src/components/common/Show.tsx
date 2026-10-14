"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { usePathname } from "@/i18n/routing";
import { useAuthStore } from "@/features/auth";
import { useAdminSession } from "@/features/admin";
import { hasCustomerSession } from "@/lib/api-client";

/**
 * ============================================================
 *  <Show> — Ẩn/hiện nội dung theo trạng thái đăng nhập và màn hình
 * ============================================================
 *
 * Dùng trong SERVER component (Header, Footer, layout…) vì ở đó không gọi được hook client.
 * Trong CLIENT component thì gọi thẳng hook `useAuthStatus()` / `useMatchPath()` cho gọn.
 *
 * ── Điều kiện (`when`) ── các key ghi cùng lúc thì phải thoả TẤT CẢ (AND)
 *
 *   auth     Ai đang xem:
 *              "guest"    → khách chưa đăng nhập
 *              "customer" → khách hàng đã đăng nhập
 *              "staff"    → đang có phiên quản trị (ADMIN hoặc STAFF)
 *              "signedIn" → đã đăng nhập bất kỳ (customer hoặc staff)
 *            Truyền mảng = chỉ cần khớp MỘT trong số đó, vd. ["customer", "staff"].
 *
 *   path     Chỉ hiện ở các màn này (pathname đã bỏ tiền tố locale /vi, /en):
 *              "/"           → đúng trang chủ
 *              "/account/*"  → /account và mọi trang con
 *              /^\/product/  → RegExp tuỳ ý
 *            Truyền mảng = khớp MỘT trong số đó.
 *
 *   notPath  Ẩn ở các màn này. Cú pháp giống `path`.
 *
 * ── Ví dụ ──
 *   <Show when={{ auth: "guest", path: "/" }}>Newsletter</Show>
 *   <Show when={{ auth: "customer", path: ["/cart", "/checkout"] }}>…</Show>
 *   <Show when={{ notPath: "/checkout/*" }}>…</Show>
 *   <Show when={{ auth: "guest" }} fallback={<UserMenu />}><LoginButton /></Show>
 *
 * ── Lưu ý ──
 *  - CHỈ để ẩn/hiện UI, KHÔNG dùng để phân quyền. Màn cần chặn thật phải redirect ở server.
 *  - Nội dung chỉ thuộc về MỘT màn → đặt thẳng trong page.tsx của màn đó, không cần `path`.
 *  - Điều kiện nghiệp vụ (giỏ hàng, đơn hàng, khuyến mãi…) → dùng hook của feature, đừng thêm vào đây.
 *  - Server render chưa biết phiên đăng nhập: nội dung `auth` chỉ chính xác sau khi client hydrate.
 */

export type AuthCondition = "guest" | "customer" | "staff" | "signedIn";
export type PathPattern = string | RegExp;

export interface ShowWhen {
  auth?: AuthCondition | AuthCondition[];
  path?: PathPattern | PathPattern[];
  notPath?: PathPattern | PathPattern[];
}

interface ShowProps {
  when: ShowWhen;
  children: ReactNode;
  /** Nội dung thay thế khi điều kiện không thoả (mặc định không render gì) */
  fallback?: ReactNode;
}

/* Cờ `has_session` không phát sự kiện khi đổi — chỉ cần đọc lúc render, nên subscribe rỗng */
const subscribeNoop = () => () => {};

const toArray = <T,>(value: T | T[]): T[] => (Array.isArray(value) ? value : [value]);

function matchPattern(pathname: string, pattern: PathPattern): boolean {
  if (pattern instanceof RegExp) return pattern.test(pathname);
  if (pattern.endsWith("/*")) {
    const base = pattern.slice(0, -2);
    return pathname === base || pathname.startsWith(`${base}/`);
  }
  return pathname === pattern;
}

/**
 * Trạng thái đăng nhập hiện tại.
 * Đang khôi phục phiên mà trình duyệt có cờ `has_session` → coi như KHÔNG phải guest,
 * tránh khối dành cho khách nháy hiện rồi biến mất.
 */
export function useAuthStatus() {
  const isCustomer = useAuthStore((state) => state.isAuthenticated);
  const isRestoring = useAuthStore((state) => state.isLoading);
  const { isAdminOrStaff: isStaff } = useAdminSession();
  const hasSessionHint = useSyncExternalStore(subscribeNoop, hasCustomerSession, () => false);

  const isGuest = !isCustomer && !isStaff && !(isRestoring && hasSessionHint);

  return { isGuest, isCustomer, isStaff, isSignedIn: isCustomer || isStaff };
}

/** Pathname hiện tại (không kèm locale) có khớp một trong các mẫu hay không */
export function useMatchPath(patterns: PathPattern | PathPattern[]): boolean {
  const pathname = usePathname();
  return toArray(patterns).some((pattern) => matchPattern(pathname, pattern));
}

export function Show({ when, children, fallback = null }: ShowProps) {
  const pathname = usePathname();
  const status = useAuthStatus();

  const authMap: Record<AuthCondition, boolean> = {
    guest: status.isGuest,
    customer: status.isCustomer,
    staff: status.isStaff,
    signedIn: status.isSignedIn,
  };

  const visible =
    (!when.auth || toArray(when.auth).some((condition) => authMap[condition])) &&
    (!when.path || toArray(when.path).some((pattern) => matchPattern(pathname, pattern))) &&
    (!when.notPath || !toArray(when.notPath).some((pattern) => matchPattern(pathname, pattern)));

  return <>{visible ? children : fallback}</>;
}
