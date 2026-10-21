import { prisma } from "../../../core/server/db.server";
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
            canManageContent: true,
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
    throw new Error("STAFF_LIST_FAILED");
  }
}
