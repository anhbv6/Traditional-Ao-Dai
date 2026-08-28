import { prisma } from "../../server/db.server";
import { type StaffMemberItem } from "../types/staff.types";

/**
 * Lấy danh sách nhân viên kèm theo phân quyền chi tiết trực tiếp từ database
 */
export async function getStaffListQuery(): Promise<StaffMemberItem[]> {
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

    return staffMembers as StaffMemberItem[];
  } catch (error) {
    console.error("Lỗi khi query danh sách nhân viên từ DB:", error);
    throw new Error("Không thể tải danh sách nhân viên từ cơ sở dữ liệu.");
  }
}

/**
 * Lấy thông tin 1 nhân viên theo ID
 */
export async function getStaffByIdQuery(userId: string): Promise<StaffMemberItem | null> {
  try {
    const staff = await prisma.user.findUnique({
      where: { id: userId, role: "STAFF" },
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
    });

    return staff as StaffMemberItem | null;
  } catch (error) {
    console.error(`Lỗi khi query nhân viên ${userId}:`, error);
    throw new Error("Không thể tải thông tin nhân viên.");
  }
}
