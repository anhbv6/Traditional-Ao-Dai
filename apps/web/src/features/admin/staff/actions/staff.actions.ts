"use server";

import { prisma } from "../../server/db.server";
import { type StaffPermissionInput } from "../types/staff.types";
import { getStaffListQuery } from "../queries/staff.queries";

/**
 * Server Action: Lấy danh sách nhân viên kèm theo phân quyền chi tiết
 */
export async function getStaffListAction() {
  try {
    const data = await getStaffListQuery();
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error("Lỗi Action getStaffListAction:", error);
    return {
      success: false,
      error: error?.message || "Không thể tải danh sách nhân viên từ cơ sở dữ liệu.",
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
  try {
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
      error: "Không thể cập nhật phân quyền nhân viên.",
    };
  }
}

/**
 * Server Action: Khóa hoặc mở khóa tài khoản nhân viên
 */
export async function toggleStaffActiveAction(userId: string, isActive: boolean) {
  try {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { isActive },
      select: { id: true, isActive: true },
    });

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Lỗi Action toggleStaffActiveAction:", error);
    return {
      success: false,
      error: "Không thể thay đổi trạng thái tài khoản.",
    };
  }
}
