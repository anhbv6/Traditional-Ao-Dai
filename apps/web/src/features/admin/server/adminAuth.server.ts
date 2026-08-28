import { cookies } from "next/headers";
import { prisma } from "./db.server";
import { type Role } from "@repo/db";

export interface AdminSessionUser {
  id: string;
  email: string | null;
  name: string | null;
  role: Role;
  isActive: boolean;
}

export interface AdminAuthResult {
  isAuthenticated: boolean;
  user: AdminSessionUser | null;
  error?: string;
}

/**
 * Kiểm tra xác thực quyền Admin hoặc Staff trong Server Components & Server Actions.
 */
export async function checkAuthAdmin(
  requiredRole?: "ADMIN" | "STAFF"
): Promise<AdminAuthResult> {
  try {
    const cookieStore = await cookies();
    const adminToken = cookieStore.get("admin_token")?.value || cookieStore.get("auth_token")?.value;
    const authRole = cookieStore.get("auth_role")?.value;

    if (!adminToken && !authRole) {
      return {
        isAuthenticated: false,
        user: null,
        error: "Chưa đăng nhập hệ thống quản trị.",
      };
    }

    if (requiredRole === "ADMIN" && authRole && authRole !== "ADMIN") {
      return {
        isAuthenticated: false,
        user: null,
        error: "Yêu cầu quyền Super Admin để thực hiện thao tác này.",
      };
    }

    return {
      isAuthenticated: true,
      user: {
        id: "admin-session-id",
        email: "admin@aodai.vn",
        name: "Quản trị viên",
        role: (authRole as Role) || "ADMIN",
        isActive: true,
      },
    };
  } catch (error) {
    console.error("Lỗi khi kiểm tra quyền Admin:", error);
    return {
      isAuthenticated: false,
      user: null,
      error: "Không thể xác minh thông tin đăng nhập.",
    };
  }
}

/**
 * Kiểm tra phân quyền chi tiết (Granular Permission) của nhân viên Staff
 */
export async function checkStaffPermission(
  userId: string,
  permissionField: "canManageOrders" | "canUpdateTailoring" | "canManageInventory" | "canViewReports" | "canManageContent"
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
