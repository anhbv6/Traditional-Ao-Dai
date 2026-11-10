import { toVnd } from "@repo/shared";
import { TAILORING_STATUSES, type TailoringStatus } from "@repo/shared/orders";
import { type Prisma } from "@repo/db";
import { prisma } from "../../../core/server/db.server";
import { type AdminOrderDetail, type AdminOrderRow, type AdminOrdersData } from "../types/orders.types";

/** Giới hạn số đơn tải về màn danh sách (lọc / tìm ở client) — tiệm nhỏ, đủ cho vài tháng gần nhất */
const MAX_ORDERS = 500;

const rowSelect = {
  id: true,
  orderNumber: true,
  customerName: true,
  customerPhone: true,
  orderStatus: true,
  paymentStatus: true,
  paymentMethod: true,
  totalAmount: true,
  paidAmount: true,
  depositAmount: true,
  isTailored: true,
  dueDate: true,
  createdAt: true,
  items: {
    select: { productName: true, quantity: true, isCustomFit: true, tailoringStatus: true },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.OrderSelect;

type RowPayload = Prisma.OrderGetPayload<{ select: typeof rowSelect }>;
type PendingApproval = AdminOrderRow["pendingApproval"];

/** Công đoạn chậm nhất trong các món may đo — tiến độ xưởng của cả đơn */
function slowestTailoring(items: { isCustomFit: boolean; tailoringStatus: TailoringStatus }[]): TailoringStatus | null {
  const statuses = items.filter((item) => item.isCustomFit).map((item) => item.tailoringStatus);
  if (statuses.length === 0) return null;
  // Món may đo chưa vào xưởng (NOT_APPLICABLE) coi như chờ vải
  const normalized = statuses.map((status) => (status === "NOT_APPLICABLE" ? "WAITING_FABRIC" : status));
  return normalized.sort((a, b) => TAILORING_STATUSES.indexOf(a) - TAILORING_STATUSES.indexOf(b))[0];
}

function toRow(order: RowPayload, pendingApproval: PendingApproval): AdminOrderRow {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    paymentMethod: order.paymentMethod,
    totalAmount: toVnd(order.totalAmount),
    paidAmount: toVnd(order.paidAmount),
    depositAmount: toVnd(order.depositAmount),
    isTailored: order.isTailored,
    dueDate: order.dueDate?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    firstItemName: order.items[0]?.productName ?? "",
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    slowestTailoring: slowestTailoring(order.items),
    pendingApproval,
  };
}

/** Yêu cầu hủy / hoàn tiền / giảm giá đang chờ duyệt, theo id đơn */
async function pendingApprovalsFor(orderIds: string[]): Promise<Map<string, PendingApproval>> {
  if (orderIds.length === 0) return new Map();
  const approvals = await prisma.approvalRequest.findMany({
    where: { status: "PENDING", targetId: { in: orderIds }, actionType: { in: ["CANCEL_ORDER", "REFUND", "MANUAL_DISCOUNT"] } },
    select: { targetId: true, actionType: true },
    orderBy: { createdAt: "desc" },
  });
  const map = new Map<string, PendingApproval>();
  for (const approval of approvals) {
    if (!approval.targetId || map.has(approval.targetId)) continue;
    if (approval.actionType === "CANCEL_ORDER" || approval.actionType === "REFUND" || approval.actionType === "MANUAL_DISCOUNT") {
      map.set(approval.targetId, approval.actionType);
    }
  }
  return map;
}

/** Danh sách đơn mới nhất trước, kèm việc đang chờ duyệt */
export async function getAdminOrdersQuery(): Promise<AdminOrdersData> {
  const orders = await prisma.order.findMany({ select: rowSelect, orderBy: { createdAt: "desc" }, take: MAX_ORDERS });
  const approvals = await pendingApprovalsFor(orders.map((order) => order.id));
  return {
    orders: orders.map((order) => toRow(order, approvals.get(order.id) ?? null)),
    now: new Date().toISOString(),
  };
}

/** Chi tiết một đơn: các món (ảnh, SKU, giá), tiền, người tạo */
export async function getAdminOrderDetailQuery(orderId: string): Promise<AdminOrderDetail | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      ...rowSelect,
      customerEmail: true,
      shippingAddress: true,
      note: true,
      subTotal: true,
      discountAmount: true,
      shippingFee: true,
      updatedAt: true,
      createdBy: { select: { name: true, email: true } },
      items: {
        select: {
          id: true,
          productId: true,
          productName: true,
          variantName: true,
          sku: true,
          quantity: true,
          unitPrice: true,
          totalPrice: true,
          isCustomFit: true,
          tailoringStatus: true,
          product: { select: { images: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!order) return null;
  const approvals = await pendingApprovalsFor([order.id]);

  return {
    ...toRow(order, approvals.get(order.id) ?? null),
    customerEmail: order.customerEmail,
    shippingAddress: order.shippingAddress,
    note: order.note,
    subTotal: toVnd(order.subTotal),
    discountAmount: toVnd(order.discountAmount),
    shippingFee: toVnd(order.shippingFee),
    createdByName: order.createdBy?.name ?? order.createdBy?.email ?? null,
    updatedAt: order.updatedAt.toISOString(),
    lines: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      variantName: item.variantName,
      sku: item.sku,
      image: item.product.images[0] ?? null,
      quantity: item.quantity,
      unitPrice: toVnd(item.unitPrice),
      totalPrice: toVnd(item.totalPrice),
      isCustomFit: item.isCustomFit,
      tailoringStatus: item.tailoringStatus,
    })),
    now: new Date().toISOString(),
  };
}
