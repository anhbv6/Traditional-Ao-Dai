"use server";

import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { ADMIN_MODULE_ACCESS } from "../../../core/session/permissions";
import bcrypt from "bcryptjs";
import { normalizeVietnamPhone } from "@repo/shared";
import { type CreateStaffInput, type StaffPermissionInput } from "../types/staff.types";
import { getStaffListQuery } from "../queries/staff.queries";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { createStaffSchema, toggleStaffActiveSchema, updateStaffPermissionSchema } from "../schemas/staff.schemas";

/**
 * Server Action: Lấy danh sách nhân viên kèm theo phân quyền chi tiết
 */
export async function getStaffListAction() {
  const auth = await authorizeAdminAction(ADMIN_MODULE_ACCESS.staff);
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
  const auth = await authorizeAdminAction(ADMIN_MODULE_ACCESS.staff);
  if (!auth.success) return auth;

  const input = parseActionInput(updateStaffPermissionSchema, { userId, permissions });
  if (!input.success) return input;

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
        canManageContent: permissions.canManageContent,
      },
      update: {
        canManageOrders: permissions.canManageOrders,
        canUpdateTailoring: permissions.canUpdateTailoring,
        canManageInventory: permissions.canManageInventory,
        canViewReports: permissions.canViewReports,
        canManageContent: permissions.canManageContent,
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
  const auth = await authorizeAdminAction(ADMIN_MODULE_ACCESS.staff);
  if (!auth.success) return auth;

  const input = parseActionInput(toggleStaffActiveSchema, { userId, isActive });
  if (!input.success) return input;

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

/**
 * Server Action: Super Admin tạo tài khoản nhân viên (role STAFF) kèm bộ quyền chi tiết ban đầu.
 * Luôn tạo bản ghi StaffPermission để quyền hiển thị trên UI trùng với quyền server kiểm tra.
 */
export async function createStaffAction(input: CreateStaffInput) {
  const auth = await authorizeAdminAction(ADMIN_MODULE_ACCESS.staff);
  if (!auth.success) return auth;

  const parsed = parseActionInput(createStaffSchema, input);
  if (!parsed.success) return parsed;

  const { name, password, permissions } = parsed.data;
  const email = parsed.data.email.toLowerCase();
  const phone = normalizeVietnamPhone(parsed.data.phone) || null;

  try {
    const [emailOwner, phoneOwner] = await Promise.all([
      prisma.user.findUnique({ where: { email }, select: { id: true } }),
      phone ? prisma.user.findUnique({ where: { phone }, select: { id: true } }) : null,
    ]);
    if (emailOwner) return { success: false as const, error: "EMAIL_ALREADY_EXISTS" };
    if (phoneOwner) return { success: false as const, error: "PHONE_ALREADY_EXISTS" };

    const created = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: await bcrypt.hash(password, 10),
        role: "STAFF",
        isActive: true,
        isEmailVerified: true,
        staffPermission: { create: permissions },
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
            canManageContent: true,
          },
        },
      },
    });

    return { success: true as const, data: created };
  } catch (error) {
    console.error("Lỗi Action createStaffAction:", error);
    return { success: false as const, error: "STAFF_CREATE_FAILED" };
  }
}
