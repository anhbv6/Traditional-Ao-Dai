"use server";

import { prisma } from "@repo/db";

export interface StaffPermissionInput {
  canManageOrders: boolean;
  canUpdateTailoring: boolean;
  canManageInventory: boolean;
  canViewReports: boolean;
}

/**
 * Lấy danh sách nhân viên kèm theo phân quyền chi tiết
 */
export async function getStaffListAction() {
  try {
    const staffMembers = await prisma.user.findMany({
      where: {
        role: "STAFF",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isActive: true,
        createdAt: true,
        staffPermission: {
          select: {
            id: true,
            canManageOrders: true,
            canUpdateTailoring: true,
            canManageInventory: true,
            canViewReports: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return {
      success: true,
      data: staffMembers,
    };
  } catch (error) {
    console.error("Lỗi khi lấy danh sách nhân viên:", error);
    return {
      success: false,
      error: "Không thể tải danh sách nhân viên từ cơ sở dữ liệu.",
    };
  }
}

/**
 * Cập nhật hoặc cấp mới quyền chi tiết cho nhân viên
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
        ...permissions,
      },
      update: {
        ...permissions,
      },
    });

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Lỗi khi cập nhật quyền nhân viên:", error);
    return {
      success: false,
      error: "Không thể cập nhật phân quyền nhân viên.",
    };
  }
}

/**
 * Khóa hoặc mở khóa tài khoản nhân viên
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
    console.error("Lỗi khi thay đổi trạng thái nhân viên:", error);
    return {
      success: false,
      error: "Không thể thay đổi trạng thái tài khoản.",
    };
  }
}
