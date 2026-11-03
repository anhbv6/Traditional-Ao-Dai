"use server";

import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { recordAudit } from "../../../core/server/audit.server";
import { ADMIN_ACTION_ACCESS, canAccess } from "../../../core/session/permissions";
import { type ApprovalStatus } from "@repo/db";
import { getApprovalRequestsQuery } from "../queries/approval.queries";
import { type z } from "zod";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { listApprovalsSchema, reviewApprovalSchema } from "../schemas/approval.schemas";

/**
 * Server Action: Lấy danh sách yêu cầu phê duyệt
 */
export async function getApprovalRequestsAction(raw: z.input<typeof listApprovalsSchema>) {
  const auth = await authorizeAdminAction();
  if (!auth.success) return auth;

  const input = parseActionInput(listApprovalsSchema, raw);
  if (!input.success) return input;
  const { view, status } = input.data;

  // Hàng đợi và lịch sử là dữ liệu của mọi nhân viên → chỉ người duyệt; "mine" luôn khóa theo người gửi từ phiên
  if (view !== "mine" && !canAccess(auth.user, ADMIN_ACTION_ACCESS.reviewApproval)) {
    return { success: false, error: "STAFF_PERMISSION_DENIED" };
  }

  const RESOLVED: ApprovalStatus[] = ["APPROVED", "REJECTED"];
  const statuses: ApprovalStatus[] | undefined =
    view === "queue"
      ? ["PENDING"]
      : view === "history"
        ? status && status !== "PENDING"
          ? [status]
          : RESOLVED
        : status
          ? [status]
          : undefined;

  try {
    const data = await getApprovalRequestsQuery(statuses, view === "mine" ? auth.user.id : undefined);
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
        reviewedAt: new Date(),
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
    if (input.status === "APPROVED" && existing.actionType === "CANCEL_ORDER" && existing.targetId) {
      await prisma.order.update({
        where: { id: existing.targetId },
        data: { orderStatus: "CANCELLED" },
      });
    }

    await recordAudit({
      actorId: auth.user.id,
      action: input.status === "APPROVED" ? "APPROVAL_APPROVED" : "APPROVAL_REJECTED",
      targetType: "APPROVAL",
      targetId: existing.id,
      metadata: { actionType: existing.actionType, targetId: existing.targetId },
    });

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
