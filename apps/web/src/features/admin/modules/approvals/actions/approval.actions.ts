"use server";

import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { ADMIN_ACTION_ACCESS, canAccess } from "../../../core/session/permissions";
import { type ApprovalStatus } from "@repo/db";
import { getApprovalRequestsQuery } from "../queries/approval.queries";
import { type z } from "zod";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { reviewApprovalSchema } from "../schemas/approval.schemas";

/**
 * Server Action: Lấy danh sách yêu cầu phê duyệt
 */
export async function getApprovalRequestsAction(statusFilter?: ApprovalStatus) {
  const auth = await authorizeAdminAction();
  if (!auth.success) return auth;

  try {
    // ADMIN xem toàn bộ hàng đợi; STAFF chỉ xem yêu cầu do mình gửi
    const ownerFilter = canAccess(auth.user, ADMIN_ACTION_ACCESS.reviewApproval) ? undefined : auth.user.id;
    const data = await getApprovalRequestsQuery(statusFilter, ownerFilter);
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Lỗi Action getApprovalRequestsAction:", error);
    return {
      success: false,
      error: "APPROVAL_LIST_FAILED",
    };
  }
}

/**
 * Server Action: Admin phê duyệt hoặc từ chối yêu cầu của Staff
 */
export async function reviewApprovalRequestAction(raw: z.input<typeof reviewApprovalSchema>) {
  const auth = await authorizeAdminAction(ADMIN_ACTION_ACCESS.reviewApproval);
  if (!auth.success) return auth;

  const parsed = parseActionInput(reviewApprovalSchema, raw);
  if (!parsed.success) return parsed;
  const input = parsed.data;

  try {
    const existing = await prisma.approvalRequest.findUnique({
      where: { id: input.requestId },
    });

    if (!existing) {
      return {
        success: false,
        error: "APPROVAL_NOT_FOUND",
      };
    }

    if (existing.status !== "PENDING") {
      return {
        success: false,
        error: "APPROVAL_ALREADY_PROCESSED",
      };
    }

    // Cập nhật trạng thái yêu cầu
    const updated = await prisma.approvalRequest.update({
      where: { id: input.requestId },
      data: {
        status: input.status,
        reviewedById: auth.user.id,
        rejectReason: input.status === "REJECTED" ? input.rejectReason : null,
      },
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true },
        },
        reviewedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    // Nếu phê duyệt thành công, tự động thực thi logic nghiệp vụ tương ứng
    if (input.status === "APPROVED") {
      const payload = existing.payload as Record<string, unknown> | null;
      if (existing.actionType === "CANCEL_ORDER" && payload?.orderId) {
        await prisma.order.update({
          where: { id: String(payload.orderId) },
          data: { orderStatus: "CANCELLED" },
        });
      }
    }

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Lỗi Action reviewApprovalRequestAction:", error);
    return {
      success: false,
      error: "APPROVAL_REVIEW_FAILED",
    };
  }
}
