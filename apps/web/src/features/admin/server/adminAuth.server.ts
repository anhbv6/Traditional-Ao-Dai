import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { prisma } from "./db.server";
import { type Role } from "@repo/db";
import { AUTH_COOKIES } from "@repo/shared";
import { verifyAccessToken } from "@/lib/jwt.server";

export interface AdminSessionUser {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  role: Role;
  isActive: boolean;
  /** Quyền chi tiết của STAFF (null với ADMIN — Super Admin có toàn quyền) */
  staffPermission: Record<StaffPermissionField, boolean> | null;
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
  avatar: true,
  role: true,
  isActive: true,
  staffPermission: {
    select: {
      canManageOrders: true,
      canUpdateTailoring: true,
      canManageInventory: true,
      canViewReports: true,
      canManageContent: true,
    },
  },
} as const;

export type StaffPermissionField =
  | "canManageOrders"
  | "canUpdateTailoring"
  | "canManageInventory"
  | "canViewReports"
  | "canManageContent";

/**
 * Kiểm tra xác thực quyền Admin hoặc Staff trong Server Components & Server Actions.
 * - Xác minh chữ ký RS256 + hạn sử dụng của admin_token (không tin cookie auth_role từ client)
 * - Token phải gắn với UserSession còn hiệu lực (đăng xuất / khóa tài khoản có hiệu lực ngay)
 * - Vai trò và trạng thái tài khoản luôn được đọc lại từ Database
 */
export async function checkAuthAdmin(
  requiredRole?: "ADMIN" | "STAFF"
): Promise<AdminAuthResult> {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get(AUTH_COOKIES.adminToken)?.value;
    const payload = verifyAccessToken(adminToken);

    const session = payload?.sessionId
      ? await prisma.userSession.findUnique({
          where: { id: payload.sessionId },
          select: { userId: true, isRevoked: true, expiresAt: true },
        })
      : null;

    if (
      !payload ||
      !session ||
      session.userId !== payload.userId ||
      session.isRevoked ||
      session.expiresAt <= new Date()
    ) {
      return {
        isAuthenticated: false,
        user: null,
        error: "ADMIN_SESSION_EXPIRED",
      };
    }

    const found = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        ...ADMIN_SESSION_USER_SELECT,
      },
    });

    if (!found || (found.role !== "ADMIN" && found.role !== "STAFF")) {
      return {
        isAuthenticated: false,
        user: null,
        error: "ADMIN_ACCESS_DENIED",
      };
    }

    if (!found.isActive) {
      return {
        isAuthenticated: false,
        user: null,
        error: "ACCOUNT_DEACTIVATED",
      };
    }

    if (requiredRole === "ADMIN" && found.role !== "ADMIN") {
      return {
        isAuthenticated: false,
        user: found,
        error: "SUPER_ADMIN_REQUIRED",
      };
    }

    return {
      isAuthenticated: true,
      user: found,
      sessionId: payload.sessionId,
    };
  } catch (error) {
    console.error("Lỗi khi kiểm tra quyền Admin:", error);
    return {
      isAuthenticated: false,
      user: null,
      error: "ADMIN_AUTH_CHECK_FAILED",
    };
  }
}

/**
 * Kiểm tra phân quyền chi tiết (Granular Permission) của nhân viên Staff
 */
export async function checkStaffPermission(
  userId: string,
  permissionField: StaffPermissionField
): Promise<boolean> {
  try {
    const staff = await prisma.user.findUnique({
      where: { id: userId },
      include: { staffPermission: true },
    });

    if (!staff) return false;
    if (staff.role === "ADMIN") return true; // Super Admin có toàn quyền

    if (staff.role === "STAFF" && staff.staffPermission) {
      return Boolean(staff.staffPermission[permissionField]);
    }

    return false;
  } catch (error) {
    console.error("Lỗi kiểm tra quyền chi tiết Staff:", error);
    return false;
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
 * const auth = await authorizeAdminAction({ permission: "canManageOrders" });
 * if (!auth.success) return auth;
 */
export async function authorizeAdminAction(options?: {
  role?: "ADMIN";
  permission?: StaffPermissionField;
}): Promise<AdminActionAuth> {
  const result = await checkAuthAdmin(options?.role);

  if (!result.isAuthenticated || !result.user) {
    return { success: false, error: result.error || "INSUFFICIENT_PERMISSIONS" };
  }

  if (options?.permission && !(await checkStaffPermission(result.user.id, options.permission))) {
    return { success: false, error: "STAFF_PERMISSION_DENIED" };
  }

  return { success: true, user: result.user, sessionId: result.sessionId! };
}

/**
 * Cổng bảo vệ cho Server Component (page.tsx) của khu vực quản trị — đọc dữ liệu trực tiếp từ DB nên
 * không thể chỉ dựa vào proxy (proxy chỉ xác minh chữ ký, không biết phiên đã bị thu hồi hay chưa).
 * Chưa đăng nhập / phiên hết hạn -> về trang đăng nhập; thiếu quyền Super Admin -> về dashboard.
 */
export async function requireAdminPage(options?: { role?: "ADMIN" }): Promise<AdminSessionUser> {
  const locale = await getLocale();
  const result = await checkAuthAdmin();

  if (!result.isAuthenticated || !result.user) {
    // `expired=1` báo cho proxy xóa cookie admin_token cũ (Server Component không tự xóa cookie được)
    redirect(`/${locale}/admin/login?expired=1`);
  }

  if (options?.role === "ADMIN" && result.user.role !== "ADMIN") {
    redirect(`/${locale}/admin/dashboard`);
  }

  return result.user;
}
