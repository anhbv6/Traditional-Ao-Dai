"use server";

import bcrypt from "bcryptjs";
import { type z } from "zod";
import { normalizeEmail, normalizeVietnamPhone, type Permission } from "@repo/shared";
import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { recordAudit } from "../../../core/server/audit.server";
import { ADMIN_MODULE_ACCESS } from "../../../core/session/permissions";
import { type CreateStaffInput } from "../types/staff.types";
import { getStaffListQuery, STAFF_MEMBER_SELECT } from "../queries/staff.queries";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import {
  createStaffSchema,
  resetStaffPasswordSchema,
  toggleStaffActiveSchema,
  updateStaffPermissionSchema,
} from "../schemas/staff.schemas";

/** Tài khoản nhân viên đang tồn tại (không tác động lên ADMIN hay tài khoản đã xóa) */
async function findStaff(userId: string) {
  return prisma.user.findFirst({
    where: { id: userId, role: "STAFF", status: { not: "DELETED" } },
    select: { id: true, permissions: true, status: true },
  });
}

/**
 * Server Action: Lấy danh sách nhân viên kèm theo phân quyền chi tiết
 */
export async function getStaffListAction() {
  const auth = await authorizeAdminAction(ADMIN_MODULE_ACCESS.staff);
  if (!auth.success) return auth;

  try {
    return { success: true as const, data: await getStaffListQuery() };
  } catch (error) {
    console.error("Lỗi Action getStaffListAction:", error);
    return { success: false as const, error: "STAFF_LIST_FAILED" };
  }
}

/**
 * Server Action: Thay toàn bộ bộ quyền chi tiết của nhân viên
 */
export async function updateStaffPermissionAction(userId: string, permissions: Permission[]) {
  const auth = await authorizeAdminAction(ADMIN_MODULE_ACCESS.staff);
  if (!auth.success) return auth;

  const input = parseActionInput(updateStaffPermissionSchema, { userId, permissions });
  if (!input.success) return input;

  try {
    const target = await findStaff(userId);
    if (!target) {
      return { success: false as const, error: "STAFF_ONLY_OPERATION" };
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { permissions: input.data.permissions },
      select: { id: true, permissions: true },
    });

    await recordAudit({
      actorId: auth.user.id,
      action: "STAFF_PERMISSIONS_UPDATED",
      targetType: "USER",
      targetId: userId,
      metadata: { before: target.permissions, after: updated.permissions },
    });

    return { success: true as const, data: updated };
  } catch (error) {
    console.error("Lỗi Action updateStaffPermissionAction:", error);
    return { success: false as const, error: "STAFF_PERMISSION_UPDATE_FAILED" };
  }
}

/**
 * Server Action: Khóa hoặc mở khóa tài khoản nhân viên. Khóa -> thu hồi ngay mọi phiên (cả storefront lẫn quản trị).
 */
export async function toggleStaffActiveAction(userId: string, isActive: boolean) {
  const auth = await authorizeAdminAction(ADMIN_MODULE_ACCESS.staff);
  if (!auth.success) return auth;

  const input = parseActionInput(toggleStaffActiveSchema, { userId, isActive });
  if (!input.success) return input;

  if (userId === auth.user.id) {
    return { success: false as const, error: "CANNOT_DEACTIVATE_SELF" };
  }

  try {
    const target = await findStaff(userId);
    if (!target) {
      return { success: false as const, error: "STAFF_ONLY_OPERATION" };
    }

    const [updated] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: isActive
          ? { status: "ACTIVE", lockedAt: null, lockedReason: null }
          : { status: "LOCKED", lockedAt: new Date() },
        select: { id: true, status: true },
      }),
      ...(isActive ? [] : [prisma.userSession.deleteMany({ where: { userId } })]),
    ]);

    await recordAudit({
      actorId: auth.user.id,
      action: isActive ? "STAFF_UNLOCKED" : "STAFF_LOCKED",
      targetType: "USER",
      targetId: userId,
    });

    return { success: true as const, data: updated };
  } catch (error) {
    console.error("Lỗi Action toggleStaffActiveAction:", error);
    return { success: false as const, error: "STAFF_STATUS_UPDATE_FAILED" };
  }
}

/**
 * Server Action: Super Admin đặt lại mật khẩu cho nhân viên (khi nhân viên quên và không tự khôi phục được).
 * Mọi phiên của nhân viên bị thu hồi — nhân viên đăng nhập lại bằng mật khẩu mới.
 */
export async function resetStaffPasswordAction(raw: z.input<typeof resetStaffPasswordSchema>) {
  const auth = await authorizeAdminAction(ADMIN_MODULE_ACCESS.staff);
  if (!auth.success) return auth;

  const input = parseActionInput(resetStaffPasswordSchema, raw);
  if (!input.success) return input;
  const { userId, newPassword } = input.data;

  try {
    if (!(await findStaff(userId))) {
      return { success: false as const, error: "STAFF_ONLY_OPERATION" };
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash: await bcrypt.hash(newPassword, 10), passwordChangedAt: new Date() },
      }),
      prisma.userSession.deleteMany({ where: { userId } }),
    ]);

    await recordAudit({ actorId: auth.user.id, action: "STAFF_PASSWORD_RESET", targetType: "USER", targetId: userId });

    return { success: true as const };
  } catch (error) {
    console.error("Lỗi Action resetStaffPasswordAction:", error);
    return { success: false as const, error: "STAFF_PASSWORD_RESET_FAILED" };
  }
}

/**
 * Server Action: Super Admin tạo tài khoản nhân viên (role STAFF) kèm bộ quyền chi tiết ban đầu.
 * Email do ADMIN cấp được coi là đã xác minh; nhân viên dùng cùng tài khoản này để mua hàng ở storefront.
 */
export async function createStaffAction(raw: CreateStaffInput) {
  const auth = await authorizeAdminAction(ADMIN_MODULE_ACCESS.staff);
  if (!auth.success) return auth;

  const parsed = parseActionInput(createStaffSchema, raw);
  if (!parsed.success) return parsed;

  const { name, password, permissions } = parsed.data;
  const email = normalizeEmail(parsed.data.email);
  const phone = normalizeVietnamPhone(parsed.data.phone) || null;

  try {
    const [emailOwner, phoneOwner] = await Promise.all([
      prisma.user.findUnique({ where: { email }, select: { id: true } }),
      phone ? prisma.user.findUnique({ where: { phone }, select: { id: true } }) : null,
    ]);
    if (emailOwner) return { success: false as const, error: "EMAIL_ALREADY_EXISTS" };
    if (phoneOwner) return { success: false as const, error: "PHONE_ALREADY_EXISTS" };

    const now = new Date();
    const created = await prisma.user.create({
      data: {
        name,
        email,
        emailVerifiedAt: now,
        phone,
        passwordHash: await bcrypt.hash(password, 10),
        passwordChangedAt: now,
        role: "STAFF",
        permissions,
      },
      select: STAFF_MEMBER_SELECT,
    });

    await recordAudit({
      actorId: auth.user.id,
      action: "STAFF_CREATED",
      targetType: "USER",
      targetId: created.id,
      metadata: { permissions },
    });

    return { success: true as const, data: created };
  } catch (error) {
    console.error("Lỗi Action createStaffAction:", error);
    return { success: false as const, error: "STAFF_CREATE_FAILED" };
  }
}
