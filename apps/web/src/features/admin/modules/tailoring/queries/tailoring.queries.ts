import { toVnd } from "@repo/shared";
import { type Prisma } from "@repo/db";
import { prisma } from "../../../core/server/db.server";
import {
  TAILORING_MEASUREMENT_KEYS,
  type TailoringBoardData,
  type TailoringItem,
  type TailoringLogEntry,
  type TailoringOrder,
  type TailoringOrderDetailData,
} from "../types/tailoring.types";
import { DEFAULT_LEAD_TIME_DAYS, isTailoringStage, toShopDayKey } from "../utils/tailoringInsight";

/** Công đoạn đang làm dở — đơn đã hủy mà còn món ở đây thì vẫn hiện để xưởng dừng tay */
const IN_PROGRESS_STAGES = ["FABRIC_CUTTING", "SEWING", "EMBROIDERY_BEADING", "FITTING_IRONING"] as const;

const logSelect = {
  id: true,
  orderItemId: true,
  status: true,
  note: true,
  images: true,
  createdAt: true,
  staff: { select: { name: true, email: true } },
} satisfies Prisma.TailoringLogSelect;

const orderSelect = {
  id: true,
  orderNumber: true,
  customerName: true,
  customerPhone: true,
  customerEmail: true,
  shippingAddress: true,
  note: true,
  orderStatus: true,
  paymentStatus: true,
  totalAmount: true,
  paidAmount: true,
  depositAmount: true,
  dueDate: true,
  createdAt: true,
  items: {
    select: {
      id: true,
      productId: true,
      productName: true,
      variantName: true,
      quantity: true,
      isCustomFit: true,
      tailoringStatus: true,
      customNote: true,
      height: true,
      weight: true,
      bust: true,
      waist: true,
      hips: true,
      shoulder: true,
      armLength: true,
      armpit: true,
      neck: true,
      shirtLength: true,
      pantsLength: true,
      thigh: true,
      product: { select: { images: true, leadTimeDays: true, material: { select: { name: true } } } },
      tailoringLogs: { select: logSelect, orderBy: { createdAt: "desc" as const }, take: 1 },
    },
    orderBy: { createdAt: "asc" as const },
  },
} satisfies Prisma.OrderSelect;

type OrderRow = Prisma.OrderGetPayload<{ select: typeof orderSelect }>;
type LogRow = Prisma.TailoringLogGetPayload<{ select: typeof logSelect }>;

function toLogEntry(log: LogRow): TailoringLogEntry {
  return {
    id: log.id,
    orderItemId: log.orderItemId,
    status: log.status,
    note: log.note,
    images: log.images,
    staffName: log.staff.name ?? log.staff.email,
    createdAt: log.createdAt.toISOString(),
  };
}

function toTailoringOrder(order: OrderRow): TailoringOrder {
  const items: TailoringItem[] = order.items
    .filter((item) => item.isCustomFit)
    .map((item) => {
      const lastLog = item.tailoringLogs[0] ? toLogEntry(item.tailoringLogs[0]) : null;
      const measurements: TailoringItem["measurements"] = {};
      for (const key of TAILORING_MEASUREMENT_KEYS) {
        const value = item[key];
        if (value !== null) measurements[key] = value;
      }
      return {
        id: item.id,
        productId: item.productId,
        productName: item.productName,
        variantName: item.variantName,
        image: item.product.images[0] ?? null,
        materialName: item.product.material?.name ?? null,
        quantity: item.quantity,
        // Món may đo chưa vào xưởng (NOT_APPLICABLE) coi như đang chờ vải
        status: isTailoringStage(item.tailoringStatus) ? item.tailoringStatus : "WAITING_FABRIC",
        leadTimeDays: item.product.leadTimeDays ?? DEFAULT_LEAD_TIME_DAYS,
        measurements,
        customNote: item.customNote,
        stageSince: lastLog?.createdAt ?? order.createdAt.toISOString(),
        lastLog,
      };
    });

  return {
    id: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    orderStatus: order.orderStatus,
    paymentStatus: order.paymentStatus,
    totalAmount: toVnd(order.totalAmount),
    paidAmount: toVnd(order.paidAmount),
    depositAmount: toVnd(order.depositAmount),
    dueDate: order.dueDate?.toISOString() ?? null,
    createdAt: order.createdAt.toISOString(),
    note: order.note,
    items,
    readyMadeCount: order.items.filter((item) => !item.isCustomFit).reduce((sum, item) => sum + item.quantity, 0),
  };
}

/**
 * Đơn có món may đo đang ở xưởng: đơn chưa đóng gói (chờ xác nhận / đã xác nhận / đang may),
 * cộng đơn đã hủy mà còn món đang làm dở (để xưởng dừng tay).
 */
export async function getTailoringBoardQuery(): Promise<TailoringBoardData> {
  const orders = await prisma.order.findMany({
    where: {
      items: { some: { isCustomFit: true } },
      OR: [
        { orderStatus: { in: ["PENDING", "CONFIRMED", "IN_PRODUCTION"] } },
        {
          orderStatus: { in: ["CANCELLED", "REFUNDED"] },
          items: { some: { isCustomFit: true, tailoringStatus: { in: [...IN_PROGRESS_STAGES] } } },
        },
      ],
    },
    select: orderSelect,
    orderBy: { createdAt: "desc" },
    take: 300,
  });

  const now = new Date();
  return {
    orders: orders.map(toTailoringOrder).filter((order) => order.items.length > 0),
    todayKey: toShopDayKey(now),
    now: now.toISOString(),
  };
}

/** Phiếu may của một đơn: các món may đo + toàn bộ nhật ký xưởng */
export async function getTailoringOrderDetailQuery(orderId: string): Promise<TailoringOrderDetailData | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { ...orderSelect, tailoringLogs: { select: logSelect, orderBy: { createdAt: "desc" } } },
  });
  if (!order) return null;
  const base = toTailoringOrder(order);
  if (base.items.length === 0) return null;

  const now = new Date();
  return {
    ...base,
    customerEmail: order.customerEmail,
    shippingAddress: order.shippingAddress,
    logs: order.tailoringLogs.map(toLogEntry),
    todayKey: toShopDayKey(now),
    now: now.toISOString(),
  };
}
