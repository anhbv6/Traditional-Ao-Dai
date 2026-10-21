import { prisma } from "../../server/db.server";
import { type ApprovalStatus } from "@repo/db";
import { type ApprovalRequestItem } from "../types/approval.types";

/**
 * Đọc danh sách các yêu cầu phê duyệt từ cơ sở dữ liệu (Chỉ dùng cho Server Components hoặc Server Actions)
 */
export async function getApprovalRequestsQuery(
  statusFilter?: ApprovalStatus,
  requestedById?: string
): Promise<ApprovalRequestItem[]> {
  try {
    const requests = await prisma.approvalRequest.findMany({
      where: {
        ...(statusFilter ? { status: statusFilter } : {}),
        // Giới hạn theo người gửi (STAFF chỉ xem yêu cầu của chính mình)
        ...(requestedById ? { requestedById } : {}),
      },
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true },
        },
        reviewedBy: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return requests as ApprovalRequestItem[];
  } catch (error) {
    console.error("Lỗi khi query danh sách phê duyệt từ DB:", error);
    throw new Error("APPROVAL_LIST_FAILED");
  }
}
