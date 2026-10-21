import { type OrderStatus, type TailoringStatus } from "@repo/db";
import { toVnd } from "@repo/shared";
import { prisma } from "../../../core/server/db.server";
import {
  type DashboardKpis,
  type LowFabric,
  type MeasurementSnapshot,
  type PipelineCard,
  type PipelineStage,
  type TodayAppointment,
  URGENT_DAYS,
} from "../types/dashboard.types";

const DAY_MS = 24 * 60 * 60 * 1000;
// Việt Nam cố định UTC+7 (không đổi giờ mùa hè) → tính mốc ngày/tháng không phụ thuộc múi giờ máy chủ
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** Mốc 00:00 hôm nay và ngày 1 của tháng này theo giờ Việt Nam */
function getVnPeriodStarts(now: Date) {
  const vn = new Date(now.getTime() + VN_OFFSET_MS);
  const dayStart = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), vn.getUTCDate()) - VN_OFFSET_MS);
  const monthStart = new Date(Date.UTC(vn.getUTCFullYear(), vn.getUTCMonth(), 1) - VN_OFFSET_MS);
  return { dayStart, dayEnd: new Date(dayStart.getTime() + DAY_MS), monthStart };
}

/** Số ngày lịch theo giờ VN giữa hai thời điểm (to - from) */
function vnDaysBetween(from: Date, to: Date): number {
  const toVnDay = (date: Date) => Math.floor((date.getTime() + VN_OFFSET_MS) / DAY_MS);
  return toVnDay(to) - toVnDay(from);
}

/** Đơn còn đang xử lý (chưa giao xong, chưa huỷ / hoàn tiền) */
const OPEN_ORDER_STATUSES: OrderStatus[] = ["PENDING", "CONFIRMED", "IN_PRODUCTION", "READY_TO_SHIP", "SHIPPING"];

/** Thứ tự công đoạn may — dùng để lấy công đoạn chậm nhất của một đơn nhiều áo */
const TAILORING_ORDER: Record<TailoringStatus, number> = {
  NOT_APPLICABLE: 0,
  WAITING_FABRIC: 1,
  FABRIC_CUTTING: 2,
  SEWING: 3,
  EMBROIDERY_BEADING: 4,
  FITTING_IRONING: 5,
  COMPLETED: 6,
};

/**
 * Quy đơn về cột Kanban: trạng thái đơn quyết định bước duyệt / giao hàng,
 * còn giữa hai bước đó thì theo công đoạn may chậm nhất của các áo may đo
 */
function resolveStage(orderStatus: OrderStatus, tailoringStatus: TailoringStatus): PipelineStage {
  if (orderStatus === "PENDING") return "review";
  if (orderStatus === "READY_TO_SHIP" || orderStatus === "SHIPPING") return "delivery";
  if (tailoringStatus === "COMPLETED") return "delivery";
  if (tailoringStatus === "FITTING_IRONING") return "fitting";
  if (tailoringStatus === "FABRIC_CUTTING" || tailoringStatus === "SEWING" || tailoringStatus === "EMBROIDERY_BEADING") {
    return "sewing";
  }
  return "cutting";
}

/* ============================================================================
 * A. THẺ CHỈ SỐ
 * ========================================================================== */

interface KpiAccess {
  reports: boolean;
  operations: boolean;
}

/**
 * 4 nhóm chỉ số vận hành. Nhóm nào người dùng không có quyền thì trả null (không truy vấn)
 */
export async function getDashboardKpisQuery(access: KpiAccess): Promise<DashboardKpis> {
  const now = new Date();
  const { dayStart, dayEnd, monthStart } = getVnPeriodStarts(now);
  const urgentUntil = new Date(now.getTime() + URGENT_DAYS * DAY_MS);

  const [finance, tailoringGroups, dueSoon, overdue, appointmentGroups] = await Promise.all([
    access.reports
      ? Promise.all([
          prisma.order.aggregate({ where: { createdAt: { gte: dayStart } }, _sum: { paidAmount: true } }),
          prisma.order.aggregate({ where: { createdAt: { gte: monthStart } }, _sum: { paidAmount: true } }),
          prisma.order.findMany({
            where: { paymentStatus: "PARTIALLY_PAID", orderStatus: { in: OPEN_ORDER_STATUSES } },
            select: { totalAmount: true, paidAmount: true },
          }),
        ])
      : null,
    access.operations
      ? prisma.orderItem.groupBy({
          by: ["tailoringStatus"],
          where: {
            isCustomFit: true,
            tailoringStatus: { in: ["WAITING_FABRIC", "FABRIC_CUTTING", "SEWING", "EMBROIDERY_BEADING"] },
            // Đơn còn chờ duyệt chưa lên bàn may dù áo đã có công đoạn (VD bị kéo ngược về cột duyệt)
            order: { orderStatus: { in: ["CONFIRMED", "IN_PRODUCTION"] } },
          },
          _sum: { quantity: true },
        })
      : null,
    access.operations
      ? prisma.order.count({ where: { orderStatus: { in: OPEN_ORDER_STATUSES }, dueDate: { gte: now, lte: urgentUntil } } })
      : null,
    access.operations
      ? prisma.order.count({ where: { orderStatus: { in: OPEN_ORDER_STATUSES }, dueDate: { lt: now } } })
      : null,
    access.operations
      ? prisma.appointment.groupBy({
          by: ["type"],
          where: { scheduledAt: { gte: dayStart, lt: dayEnd }, status: { not: "CANCELLED" } },
          _count: { _all: true },
        })
      : null,
  ]);

  const sumTailoring = (...statuses: TailoringStatus[]) =>
    (tailoringGroups ?? []).filter((g) => statuses.includes(g.tailoringStatus)).reduce((sum, g) => sum + (g._sum.quantity ?? 0), 0);
  const countAppointments = (type?: string) =>
    (appointmentGroups ?? []).filter((g) => !type || g.type === type).reduce((sum, g) => sum + g._count._all, 0);

  return {
    finance: finance
      ? {
          receivedToday: toVnd(finance[0]._sum.paidAmount),
          receivedMonth: toVnd(finance[1]._sum.paidAmount),
          outstanding: finance[2].reduce((sum, o) => sum + Math.max(0, toVnd(o.totalAmount) - toVnd(o.paidAmount)), 0),
          outstandingOrders: finance[2].length,
        }
      : null,
    tailoring: tailoringGroups
      ? {
          waitingCut: sumTailoring("WAITING_FABRIC"),
          sewing: sumTailoring("FABRIC_CUTTING", "SEWING"),
          embroidery: sumTailoring("EMBROIDERY_BEADING"),
        }
      : null,
    urgent: dueSoon !== null && overdue !== null ? { dueSoon, overdue } : null,
    appointments: appointmentGroups
      ? { total: countAppointments(), measurement: countAppointments("MEASUREMENT"), fitting: countAppointments("FITTING") }
      : null,
  };
}

/* ============================================================================
 * B. KANBAN MAY ĐO
 * ========================================================================== */

/**
 * Các đơn may đo đang mở, đã quy về cột Kanban; sắp theo ngày hẹn trả gần nhất trước
 */
export async function getPipelineQuery(): Promise<PipelineCard[]> {
  const now = new Date();
  const orders = await prisma.order.findMany({
    where: { orderStatus: { in: OPEN_ORDER_STATUSES }, items: { some: { isCustomFit: true } } },
    select: {
      id: true,
      orderNumber: true,
      customerName: true,
      dueDate: true,
      totalAmount: true,
      paidAmount: true,
      orderStatus: true,
      items: { where: { isCustomFit: true }, select: { productName: true, tailoringStatus: true } },
    },
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "asc" }],
    take: 150,
  });

  return orders.map((order) => {
    const slowest = order.items.reduce<TailoringStatus>(
      (min, item) => (TAILORING_ORDER[item.tailoringStatus] < TAILORING_ORDER[min] ? item.tailoringStatus : min),
      "COMPLETED"
    );
    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      daysLeft: order.dueDate ? vnDaysBetween(now, order.dueDate) : null,
      totalAmount: toVnd(order.totalAmount),
      paidAmount: toVnd(order.paidAmount),
      productNames: order.items.map((i) => i.productName),
      tailoringStatus: slowest,
      stage: resolveStage(order.orderStatus, slowest),
    };
  });
}

/* ============================================================================
 * C. LỊCH HẸN HÔM NAY & KHO VẢI
 * ========================================================================== */

const MEASUREMENT_FIELDS = {
  height: true,
  weight: true,
  bust: true,
  waist: true,
  hips: true,
  shoulder: true,
  armLength: true,
  shirtLength: true,
  pantsLength: true,
} as const;

/**
 * Lịch hẹn hôm nay (theo giờ VN) kèm số đo để mở nhanh: ưu tiên hồ sơ số đo mặc định của khách,
 * không có thì lấy số đo đã chốt trên đơn may đo gắn với lịch hẹn
 */
export async function getTodayAppointmentsQuery(): Promise<TodayAppointment[]> {
  const now = new Date();
  const { dayStart, dayEnd } = getVnPeriodStarts(now);

  const appointments = await prisma.appointment.findMany({
    where: { scheduledAt: { gte: dayStart, lt: dayEnd }, status: { not: "CANCELLED" } },
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      scheduledAt: true,
      customerName: true,
      customerPhone: true,
      type: true,
      note: true,
      user: {
        select: {
          measurements: {
            orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
            take: 1,
            select: { profileName: true, note: true, ...MEASUREMENT_FIELDS },
          },
        },
      },
      order: {
        select: {
          orderNumber: true,
          items: { where: { isCustomFit: true }, take: 1, select: { customNote: true, ...MEASUREMENT_FIELDS } },
        },
      },
    },
  });

  return appointments.map((a) => {
    const profile = a.user?.measurements[0];
    const orderItem = a.order?.items[0];
    let measurement: MeasurementSnapshot | null = null;
    if (profile) {
      const { profileName, note, ...values } = profile;
      measurement = { source: profileName, note, ...values };
    } else if (orderItem && a.order) {
      const { customNote, ...values } = orderItem;
      measurement = { source: a.order.orderNumber, note: customNote, ...values };
    }

    return {
      id: a.id,
      scheduledAt: a.scheduledAt.toISOString(),
      isPast: a.scheduledAt < now,
      customerName: a.customerName,
      customerPhone: a.customerPhone,
      type: a.type,
      note: a.note,
      orderNumber: a.order?.orderNumber ?? null,
      measurement,
    };
  });
}

/**
 * Cây vải đang dùng có số mét còn lại dưới ngưỡng cảnh báo của chính nó (mặc định 3 m)
 */
export async function getLowFabricsQuery(): Promise<LowFabric[]> {
  const fabrics = await prisma.fabric.findMany({
    where: { isActive: true, remainingMeters: { lt: prisma.fabric.fields.lowStockThreshold } },
    orderBy: { remainingMeters: "asc" },
    take: 12,
    select: {
      id: true,
      code: true,
      name: true,
      color: true,
      remainingMeters: true,
      lowStockThreshold: true,
      product: { select: { id: true, name: true, isActive: true } },
    },
  });

  return fabrics.map((f) => ({
    id: f.id,
    code: f.code,
    name: f.name,
    color: f.color,
    remainingMeters: Number(f.remainingMeters),
    threshold: Number(f.lowStockThreshold),
    product: f.product,
  }));
}
