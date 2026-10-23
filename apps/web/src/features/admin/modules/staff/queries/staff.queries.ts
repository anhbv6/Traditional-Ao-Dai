import { prisma } from "../../../core/server/db.server";
import { type StaffMemberItem } from "../types/staff.types";

/** Các trường của một dòng nhân viên (dùng chung cho danh sách và kết quả tạo mới) */
export const STAFF_MEMBER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  status: true,
  permissions: true,
  lastLoginAt: true,
  createdAt: true,
} as const;

/**
 * Lấy danh sách nhân viên kèm quyền chi tiết (không gồm tài khoản đã xóa)
 */
export async function getStaffListQuery(): Promise<StaffMemberItem[]> {
  try {
    return await prisma.user.findMany({
      where: { role: "STAFF", status: { not: "DELETED" } },
      select: STAFF_MEMBER_SELECT,
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Lỗi khi query danh sách nhân viên từ DB:", error);
    throw new Error("STAFF_LIST_FAILED");
  }
}
