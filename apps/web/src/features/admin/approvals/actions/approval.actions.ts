"use server";

import { prisma } from "../../server/db.server";
import { type ApprovalStatus } from "@repo/db";
import { type CreateApprovalInput, type ReviewApprovalInput } from "../types/approval.types";
import { getApprovalRequestsQuery } from "../queries/approval.queries";

/**
 * Server Action: Lấy danh sách yêu cầu phê duyệt
 */
export async function getApprovalRequestsAction(statusFilter?: ApprovalStatus) {
  try {
    const data = await getApprovalRequestsQuery(statusFilter);
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error("Lỗi Action getApprovalRequestsAction:", error);
    return {
      success: false,
      error: error?.message || "Không thể tải danh sách phê duyệt từ cơ sở dữ liệu.",
    };
  }
}

/**
 * Server Action: Nhân viên tạo yêu cầu gửi lên Admin phê duyệt
 */
export async function createApprovalRequestAction(input: CreateApprovalInput) {
  try {
    const request = await prisma.approvalRequest.create({
      data: {
        actionType: input.actionType,
        description: input.description,
        payload: input.payload as any,
        status: "PENDING",
        requestedById: input.requestedById,
      },
      include: {
        requestedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return {
      success: true,
      data: request,
    };
  } catch (error) {
    console.error("Lỗi Action createApprovalRequestAction:", error);
    return {
      success: false,
      error: "Không thể tạo yêu cầu phê duyệt.",
    };
  }
}

/**
 * Server Action: Admin phê duyệt hoặc từ chối yêu cầu của Staff
 */
export async function reviewApprovalRequestAction(input: ReviewApprovalInput) {
  try {
    const existing = await prisma.approvalRequest.findUnique({
      where: { id: input.requestId },
    });

    if (!existing) {
      return {
        success: false,
        error: "Yêu cầu phê duyệt không tồn tại.",
      };
    }

    if (existing.status !== "PENDING") {
      return {
        success: false,
        error: "Yêu cầu này đã được xử lý trước đó.",
      };
    }

    // Cập nhật trạng thái yêu cầu
    const updated = await prisma.approvalRequest.update({
      where: { id: input.requestId },
      data: {
        status: input.status,
        reviewedById: input.reviewedById,
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
      const payload = existing.payload as Record<string, any>;
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
      error: "Không thể xử lý phê duyệt yêu cầu.",
    };
  }
}
