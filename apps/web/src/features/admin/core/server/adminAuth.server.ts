import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { prisma } from "./db.server";
import { type Role, type UserStatus } from "@repo/db";
import {
  ADMIN_SESSION_IDLE_TIMEOUT_MS,
  AUTH_COOKIES,
  SESSION_TOUCH_INTERVAL_MS,
  isAdminAreaRole,
  type Permission,
} from "@repo/shared";
import { verifyAdminToken } from "@/lib/jwt.server";
import { canAccess, type AdminAccessRule } from "../session/permissions";

export interface AdminSessionUser {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  avatarUrl: string | null;
  role: Role;
  status: UserStatus;
  /** Quyền chi tiết của STAFF (ADMIN có toàn quyền nên mảng này không được dùng) */
  permissions: Permission[];
}

export interface AdminAuthResult {
  isAuthenticated: boolean;
  user: AdminSessionUser | null;
  sessionId?: string;
  error?: string;
}

/** Các trường trả về cho phiên quản trị (dùng chung cho checkAuthAdmin & Server Actions cập nhật hồ sơ) */
export const ADMIN_SESSION_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  avatarUrl: true,
  role: true,
  status: true,
  permissions: true,
} as const;

const EXPIRED: AdminAuthResult = { isAuthenticated: false, user: null, error: "ADMIN_SESSION_EXPIRED" };

/**
 * Kiểm tra xác thực khu quản trị trong Server Components & Server Actions.
 * - Xác minh chữ ký RS256 + hạn dùng + audience `admin` của cookie admin_token
 * - Token phải gắn với UserSession ADMIN còn hiệu lực và chưa nhàn rỗi quá lâu (đăng xuất / khóa có hiệu lực ngay)
 * - Vai trò, trạng thái và quyền luôn được đọc lại từ Database
 */
export async function checkAuthAdmin(requiredRole?: "ADMIN" | "STAFF"): Promise<AdminAuthResult> {
  try {
    const cookieStore = await cookies();
    const payload = verifyAdminToken(cookieStore.get(AUTH_COOKIES.adminToken)?.value);
    if (!payload) return EXPIRED;

    const session = await prisma.userSession.findUnique({
      where: { id: payload.sessionId },
      select: {
        userId: true,
        kind: true,
        expiresAt: true,
        revokedAt: true,
        lastUsedAt: true,
        user: { select: ADMIN_SESSION_USER_SELECT },
      },
    });

    const now = Date.now();
    if (
      !session ||
      session.kind !== "ADMIN" ||
      session.userId !== payload.userId ||
      session.revokedAt ||
      session.expiresAt.getTime() <= now ||
      now - session.lastUsedAt.getTime() > ADMIN_SESSION_IDLE_TIMEOUT_MS
    ) {
      return EXPIRED;
    }

    const user = session.user;
    if (!isAdminAreaRole(user.role)) {
      return { isAuthenticated: false, user: null, error: "ADMIN_ACCESS_DENIED" };
    }

    if (user.status !== "ACTIVE") {
      return { isAuthenticated: false, user: null, error: "ACCOUNT_DEACTIVATED" };
    }

    if (requiredRole === "ADMIN" && user.role !== "ADMIN") {
      return { isAuthenticated: false, user, error: "SUPER_ADMIN_REQUIRED" };
    }

    // Gia hạn thời gian nhàn rỗi — chỉ ghi DB khi lastUsedAt đã cũ để không UPDATE ở mọi request
    if (now - session.lastUsedAt.getTime() >= SESSION_TOUCH_INTERVAL_MS) {
      await prisma.userSession.update({ where: { id: payload.sessionId }, data: { lastUsedAt: new Date(now) } });
    }

    return { isAuthenticated: true, user, sessionId: payload.sessionId };
  } catch (error) {
    console.error("Lỗi khi kiểm tra quyền Admin:", error);
    return { isAuthenticated: false, user: null, error: "ADMIN_AUTH_CHECK_FAILED" };
  }
}

export type AdminActionAuth =
  | { success: true; user: AdminSessionUser; sessionId: string }
  | { success: false; error: string };

/**
 * Cổng bảo vệ bắt buộc ở đầu mỗi Server Action quản trị.
 * Server Action là endpoint công khai — việc ẩn nút trên UI KHÔNG phải là lớp bảo mật.
 *
 * @example
 * const auth = await authorizeAdminAction({ permission: "MANAGE_ORDERS" });
 * if (!auth.success) return auth;
 */
export async function authorizeAdminAction(options?: AdminAccessRule): Promise<AdminActionAuth> {
  const result = await checkAuthAdmin(options?.role);

  if (!result.isAuthenticated || !result.user) {
    return { success: false, error: result.error || "INSUFFICIENT_PERMISSIONS" };
  }

  // Quyền chi tiết đã nằm trong phiên (đọc từ DB ở checkAuthAdmin) -> không cần truy vấn thêm
  if (!canAccess(result.user, options)) {
    return { success: false, error: "STAFF_PERMISSION_DENIED" };
  }

  return { success: true, user: result.user, sessionId: result.sessionId! };
}

/**
 * Cổng bảo vệ cho Server Component (page.tsx) của khu vực quản trị — đọc dữ liệu trực tiếp từ DB nên
 * không thể chỉ dựa vào proxy (proxy chỉ xác minh chữ ký, không biết phiên đã bị thu hồi hay chưa).
 * Chưa đăng nhập / phiên hết hạn -> về trang đăng nhập; thiếu quyền (ADMIN_MODULE_ACCESS) -> về dashboard.
 */
export async function requireAdminPage(options?: AdminAccessRule): Promise<AdminSessionUser> {
  const locale = await getLocale();
  const result = await checkAuthAdmin();

  if (!result.isAuthenticated || !result.user) {
    // `expired=1` báo cho proxy xóa cookie admin_token cũ (Server Component không tự xóa cookie được)
    redirect(`/${locale}/admin/login?expired=1`);
  }

  // Thiếu quyền Super Admin / quyền chi tiết của module -> về dashboard (menu cũng đã ẩn module này)
  if (!canAccess(result.user, options)) {
    redirect(`/${locale}/admin/dashboard`);
  }

  return result.user;
}
