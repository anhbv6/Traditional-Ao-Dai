"use server";

import { prisma } from "../../server/db.server";
import { authorizeAdminAction } from "../../server/adminAuth.server";
import { type StaffPermissionInput } from "../types/staff.types";
import { getStaffListQuery } from "../queries/staff.queries";

/**
 * Server Action: Lấy danh sách nhân viên kèm theo phân quyền chi tiết
 */
export async function getStaffListAction() {
  const auth = await authorizeAdminAction({ role: "ADMIN" });
  if (!auth.success) return auth;

  try {
    const data = await getStaffListQuery();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Lỗi Action getStaffListAction:", error);
    return {
      success: false,
      error: "STAFF_LIST_FAILED",
    };
  }
}

/**
 * Server Action: Cập nhật hoặc cấp mới quyền chi tiết cho nhân viên
 */
export async function updateStaffPermissionAction(
  userId: string,
  permissions: StaffPermissionInput
) {
  const auth = await authorizeAdminAction({ role: "ADMIN" });
  if (!auth.success) return auth;

  try {
    // Chỉ cấp quyền chi tiết cho tài khoản STAFF
    const target = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (target?.role !== "STAFF") {
      return { success: false, error: "STAFF_ONLY_OPERATION" };
    }

    const updated = await prisma.staffPermission.upsert({
      where: { userId },
      create: {
        userId,
        canManageOrders: permissions.canManageOrders,
        canUpdateTailoring: permissions.canUpdateTailoring,
        canManageInventory: permissions.canManageInventory,
        canViewReports: permissions.canViewReports,
        canManageContent: Boolean(permissions.canManageContent),
      },
      update: {
        canManageOrders: permissions.canManageOrders,
        canUpdateTailoring: permissions.canUpdateTailoring,
        canManageInventory: permissions.canManageInventory,
        canViewReports: permissions.canViewReports,
        canManageContent: Boolean(permissions.canManageContent),
      },
    });

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Lỗi Action updateStaffPermissionAction:", error);
    return {
      success: false,
      error: "STAFF_PERMISSION_UPDATE_FAILED",
    };
  }
}

/**
 * Server Action: Khóa hoặc mở khóa tài khoản nhân viên
 */
export async function toggleStaffActiveAction(userId: string, isActive: boolean) {
  const auth = await authorizeAdminAction({ role: "ADMIN" });
  if (!auth.success) return auth;

  try {
    // Không cho phép tự khóa tài khoản của chính mình, và chỉ tác động lên tài khoản STAFF
    if (userId === auth.user.id) {
      return { success: false, error: "CANNOT_DEACTIVATE_SELF" };
    }

    const [updated] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId, role: "STAFF" },
        data: { isActive },
        select: { id: true, isActive: true },
      }),
      // Khóa tài khoản -> thu hồi ngay mọi phiên đăng nhập của nhân viên
      ...(isActive ? [] : [prisma.userSession.deleteMany({ where: { userId } })]),
    ]);

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Lỗi Action toggleStaffActiveAction:", error);
    return {
      success: false,
      error: "STAFF_STATUS_UPDATE_FAILED",
    };
  }
}
