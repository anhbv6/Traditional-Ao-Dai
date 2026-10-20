"use server";

import { type OrderStatus, type TailoringStatus } from "@repo/db";
import { revalidatePath } from "next/cache";
import { prisma } from "../../server/db.server";
import { authorizeAdminAction } from "../../server/adminAuth.server";
import { ADMIN_ACTION_ACCESS, canAccess } from "../../session/permissions";
import { PIPELINE_STAGES, type PipelineStage } from "../types/dashboard.types";
import { PIPELINE_STAGE_PERMISSION } from "../utils/pipeline";
import {
  getDashboardKpisQuery,
  getLowFabricsQuery,
  getPipelineQuery,
  getTodayAppointmentsQuery,
} from "../queries/dashboard.queries";

/** Trạng thái đơn + công đoạn áo khi chuyển đơn sang một cột (bỏ trống tailoringStatus = giữ công đoạn hiện tại) */
const STAGE_TRANSITIONS: Record<PipelineStage, { orderStatus: OrderStatus; tailoringStatus?: TailoringStatus }> = {
  review: { orderStatus: "PENDING" },
  cutting: { orderStatus: "CONFIRMED", tailoringStatus: "WAITING_FABRIC" },
  sewing: { orderStatus: "IN_PRODUCTION", tailoringStatus: "SEWING" },
  fitting: { orderStatus: "IN_PRODUCTION", tailoringStatus: "FITTING_IRONING" },
  delivery: { orderStatus: "READY_TO_SHIP", tailoringStatus: "COMPLETED" },
};

/**
 * Server Action: 4 nhóm chỉ số vận hành — nhóm không có quyền trả null
 */
export async function getDashboardKpisAction() {
  const auth = await authorizeAdminAction();
  if (!auth.success) return auth;

  try {
    const data = await getDashboardKpisQuery({
      reports: canAccess(auth.user, ADMIN_ACTION_ACCESS.viewReports),
      operations: canAccess(auth.user, ADMIN_ACTION_ACCESS.viewDashboardOrders),
    });
    return { success: true as const, data };
  } catch (error) {
    console.error("Lỗi Action getDashboardKpisAction:", error);
    return { success: false as const, error: "DASHBOARD_STATS_FAILED" };
  }
}

/**
 * Server Action: Các đơn may đo đang mở cho bảng điều phối (Kanban)
 */
export async function getPipelineAction() {
  const auth = await authorizeAdminAction(ADMIN_ACTION_ACCESS.viewDashboardOrders);
  if (!auth.success) return auth;

  try {
    return { success: true as const, data: await getPipelineQuery() };
  } catch (error) {
    console.error("Lỗi Action getPipelineAction:", error);
    return { success: false as const, error: "ORDER_LIST_FAILED" };
  }
}

/**
 * Server Action: Chuyển đơn sang cột Kanban — cập nhật trạng thái đơn, công đoạn áo may đo và ghi nhật ký may
 */
export async function moveOrderStageAction(orderId: string, stage: PipelineStage) {
  if (!PIPELINE_STAGES.includes(stage)) return { success: false as const, error: "ORDER_STATUS_UPDATE_FAILED" };
  const auth = await authorizeAdminAction(PIPELINE_STAGE_PERMISSION[stage]);
  if (!auth.success) return auth;

  try {
    const target = STAGE_TRANSITIONS[stage];
    const items = await prisma.orderItem.findMany({
      where: { orderId, isCustomFit: true },
      select: { id: true, tailoringStatus: true },
    });
    const nextStatus = target.tailoringStatus;
    // Vào cột "Đang may" mà áo đã ở cắt / may / thêu thì giữ nguyên công đoạn đó
    const changedItems = nextStatus
      ? items.filter((item) =>
          stage === "sewing"
            ? !["FABRIC_CUTTING", "SEWING", "EMBROIDERY_BEADING"].includes(item.tailoringStatus)
            : item.tailoringStatus !== nextStatus
        )
      : [];

    await prisma.$transaction([
      prisma.order.update({ where: { id: orderId }, data: { orderStatus: target.orderStatus } }),
      ...(nextStatus
        ? changedItems.flatMap((item) => [
            prisma.orderItem.update({ where: { id: item.id }, data: { tailoringStatus: nextStatus } }),
            prisma.tailoringLog.create({
              data: { orderId, orderItemId: item.id, status: nextStatus, staffId: auth.user.id },
            }),
          ])
        : []),
    ]);

    revalidatePath("/admin/orders");
    revalidatePath("/admin/tailoring");
    return { success: true as const };
  } catch (error) {
    console.error("Lỗi Action moveOrderStageAction:", error);
    return { success: false as const, error: "ORDER_STATUS_UPDATE_FAILED" };
  }
}

/**
 * Server Action: Lịch hẹn tại tiệm trong hôm nay (kèm số đo để mở nhanh)
 */
export async function getTodayAppointmentsAction() {
  const auth = await authorizeAdminAction(ADMIN_ACTION_ACCESS.viewDashboardOrders);
  if (!auth.success) return auth;

  try {
    return { success: true as const, data: await getTodayAppointmentsQuery() };
  } catch (error) {
    console.error("Lỗi Action getTodayAppointmentsAction:", error);
    return { success: false as const, error: "APPOINTMENT_LIST_FAILED" };
  }
}

/**
 * Server Action: Cây vải sắp hết (dưới ngưỡng mét cảnh báo)
 */
export async function getLowFabricsAction() {
  const auth = await authorizeAdminAction(ADMIN_ACTION_ACCESS.manageInventory);
  if (!auth.success) return auth;

  try {
    return { success: true as const, data: await getLowFabricsQuery() };
  } catch (error) {
    console.error("Lỗi Action getLowFabricsAction:", error);
    return { success: false as const, error: "INVENTORY_LIST_FAILED" };
  }
}

/**
 * Server Action: Ẩn sản phẩm may từ cây vải sắp hết khỏi web (khách không đặt thêm được)
 */
export async function hideFabricProductAction(productId: string) {
  const auth = await authorizeAdminAction(ADMIN_ACTION_ACCESS.manageInventory);
  if (!auth.success) return auth;

  try {
    await prisma.product.update({ where: { id: productId }, data: { isActive: false } });
    revalidatePath("/admin/products");
    return { success: true as const };
  } catch (error) {
    console.error("Lỗi Action hideFabricProductAction:", error);
    return { success: false as const, error: "PRODUCT_UPDATE_FAILED" };
  }
}
