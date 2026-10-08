"use server";

import bcrypt from "bcryptjs";
import { z } from "zod";
import { newPasswordSchema, normalizeVietnamPhone, vietnamPhoneSchema } from "@repo/shared";
import { prisma } from "../../server/db.server";
import {
  ADMIN_SESSION_USER_SELECT,
  authorizeAdminAction,
  checkAuthAdmin,
  type AdminSessionUser,
} from "../../server/adminAuth.server";

/**
 * Server Action: Lấy thông tin phiên Admin/Staff hiện tại (thay cho localStorage `admin_user`).
 * Trả về null khi chưa đăng nhập hoặc phiên đã hết hạn / bị thu hồi.
 */
export async function getAdminSessionAction(): Promise<AdminSessionUser | null> {
  const result = await checkAuthAdmin();
  return result.isAuthenticated ? result.user : null;
}

const updateProfileSchema = z.object({
  name: z.string().trim().min(1, "NAME_REQUIRED"),
  phone: vietnamPhoneSchema.optional().or(z.literal("")),
  avatar: z.string().url("AVATAR_URL_INVALID").optional().or(z.literal("")),
});

/**
 * Server Action: Admin/Staff tự cập nhật hồ sơ (tên, SĐT, ảnh đại diện)
 */
export async function updateAdminProfileAction(input: z.input<typeof updateProfileSchema>) {
  const auth = await authorizeAdminAction();
  if (!auth.success) return auth;

  const parsed = updateProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message || "VALIDATION_ERROR" };
  }

  try {
    const phone = normalizeVietnamPhone(parsed.data.phone) || null;
    if (phone) {
      const phoneOwner = await prisma.user.findUnique({ where: { phone }, select: { id: true } });
      if (phoneOwner && phoneOwner.id !== auth.user.id) {
        return { success: false as const, error: "PHONE_ALREADY_EXISTS" };
      }
    }

    const updated = await prisma.user.update({
      where: { id: auth.user.id },
      data: {
        name: parsed.data.name,
        phone,
        avatar: parsed.data.avatar || null,
      },
      select: ADMIN_SESSION_USER_SELECT,
    });

    return { success: true as const, data: updated };
  } catch (error) {
    console.error("Lỗi updateAdminProfileAction:", error);
    return { success: false as const, error: "PROFILE_UPDATE_FAILED" };
  }
}

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "CURRENT_PASSWORD_REQUIRED"),
  newPassword: newPasswordSchema,
});

/**
 * Server Action: Admin/Staff đổi mật khẩu — thu hồi mọi phiên khác, giữ phiên hiện tại
 */
export async function changeAdminPasswordAction(input: z.input<typeof changePasswordSchema>) {
  const auth = await authorizeAdminAction();
  if (!auth.success) return auth;

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false as const, error: parsed.error.issues[0]?.message || "VALIDATION_ERROR" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.user.id },
      select: { password: true },
    });

    if (!user?.password || !(await bcrypt.compare(parsed.data.currentPassword, user.password))) {
      return { success: false as const, error: "CURRENT_PASSWORD_INCORRECT" };
    }

    const hashedPassword = await bcrypt.hash(parsed.data.newPassword, 10);
    await prisma.$transaction([
      prisma.user.update({ where: { id: auth.user.id }, data: { password: hashedPassword } }),
      prisma.userSession.deleteMany({
        where: { userId: auth.user.id, id: { not: auth.sessionId } },
      }),
    ]);

    return { success: true as const };
  } catch (error) {
    console.error("Lỗi changeAdminPasswordAction:", error);
    return { success: false as const, error: "CHANGE_PASSWORD_FAILED" };
  }
}
