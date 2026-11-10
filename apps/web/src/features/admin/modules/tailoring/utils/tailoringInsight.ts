import { CheckCircle2, Clock, Layers, Ruler, Scissors, Sparkles, type LucideIcon } from "lucide-react";
import {
  TAILORING_STAGES,
  type TailoringItem,
  type TailoringOrder,
  type TailoringStage,
} from "../types/tailoring.types";

/*
 * Luật "đọc" một đơn may đo cho xưởng — tính từ dữ liệu, không lưu.
 * Mục tiêu: chỉ ra đơn nào cần ra tay và vì sao, thay vì bắt người xem tự dò cả danh sách.
 */

/** Giờ tiệm — mốc "hôm nay" / số ngày còn lại tính theo giờ Việt Nam */
export const SHOP_TIME_ZONE = "Asia/Ho_Chi_Minh";

/** Mẫu chưa khai báo số ngày may thì coi như 14 ngày */
export const DEFAULT_LEAD_TIME_DAYS = 14;
/** Còn từ bấy nhiêu ngày trở xuống tới hẹn thì vào nhóm "sắp đến hẹn" */
export const DUE_SOON_DAYS = 3;
/** Đứng yên ở một công đoạn quá bấy nhiêu ngày thì nhắc */
export const STALL_DAYS = 4;

export const STAGE_ICONS: Record<TailoringStage, LucideIcon> = {
  WAITING_FABRIC: Clock,
  FABRIC_CUTTING: Scissors,
  SEWING: Layers,
  EMBROIDERY_BEADING: Sparkles,
  FITTING_IRONING: Ruler,
  COMPLETED: CheckCircle2,
};

export function isTailoringStage(status: string): status is TailoringStage {
  return (TAILORING_STAGES as readonly string[]).includes(status);
}

export function stageIndex(stage: TailoringStage): number {
  return TAILORING_STAGES.indexOf(stage);
}

/** Bước kế tiếp; null khi đã hoàn tất */
export function nextStage(stage: TailoringStage): TailoringStage | null {
  return TAILORING_STAGES[stageIndex(stage) + 1] ?? null;
}

const DAY = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD theo giờ tiệm */
export function toShopDayKey(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: SHOP_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}

/** Số ngày lịch giữa hai dayKey (b − a) */
export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / DAY);
}

/** Số ngày may còn lại ước lượng của một món, theo tỉ lệ công đoạn đã qua */
export function remainingWorkDays(item: Pick<TailoringItem, "status" | "leadTimeDays">): number {
  const done = stageIndex(item.status) / (TAILORING_STAGES.length - 1);
  return Math.ceil(item.leadTimeDays * (1 - done));
}

/** Mức khẩn cấp để xếp nhóm */
export type TailoringUrgency = "ACT" | "SOON" | "ON_TRACK" | "DONE";
export const URGENCY_ORDER: TailoringUrgency[] = ["ACT", "SOON", "ON_TRACK", "DONE"];

/** Tình trạng hẹn của đơn */
export type DueState = "OVERDUE" | "AT_RISK" | "DUE_SOON" | "ON_TRACK" | "NO_DUE" | "DONE";

/** Điều đang chặn / cần chú ý — mỗi tín hiệu có lý do cụ thể để người xem biết phải làm gì */
export type TailoringSignal =
  | { kind: "CANCELLED" }
  | { kind: "UNCONFIRMED" }
  | { kind: "DEPOSIT_MISSING"; missing: number }
  | { kind: "STALLED"; days: number; stage: TailoringStage }
  | { kind: "WAITING_PACK" };

export interface TailoringInsight {
  urgency: TailoringUrgency;
  dueState: DueState;
  /** Ngày còn lại tới hẹn (âm = đã trễ); null khi chưa hẹn */
  daysLeft: number | null;
  /** Ngày may còn lại ước lượng (món chậm nhất) */
  workLeft: number;
  /** Công đoạn của món chậm nhất — tiến độ của cả đơn */
  slowestStage: TailoringStage;
  signals: TailoringSignal[];
}

/**
 * Đọc một đơn: tình trạng hẹn (so ngày còn lại với số ngày may còn lại của món chậm nhất) +
 * các tín hiệu chặn (đơn hủy mà xưởng vẫn may, chưa xác nhận, thiếu cọc, đứng lâu) → nhóm khẩn cấp.
 */
export function readTailoringOrder(order: TailoringOrder, todayKey: string): TailoringInsight {
  const slowest = order.items.reduce<TailoringItem | null>(
    (worst, item) => (!worst || stageIndex(item.status) < stageIndex(worst.status) ? item : worst),
    null
  );
  const slowestStage = slowest?.status ?? "COMPLETED";
  const allDone = order.items.every((item) => item.status === "COMPLETED");
  const workLeft = Math.max(0, ...order.items.map(remainingWorkDays));
  const daysLeft = order.dueDate ? daysBetween(todayKey, toShopDayKey(new Date(order.dueDate))) : null;
  const cancelled = order.orderStatus === "CANCELLED" || order.orderStatus === "REFUNDED";

  const dueState: DueState = allDone
    ? "DONE"
    : daysLeft === null
      ? "NO_DUE"
      : daysLeft < 0
        ? "OVERDUE"
        : daysLeft < workLeft
          ? "AT_RISK"
          : daysLeft <= DUE_SOON_DAYS
            ? "DUE_SOON"
            : "ON_TRACK";

  const signals: TailoringSignal[] = [];
  if (cancelled) signals.push({ kind: "CANCELLED" });
  if (!cancelled && order.orderStatus === "PENDING") signals.push({ kind: "UNCONFIRMED" });
  if (!cancelled && order.paidAmount < order.depositAmount) {
    signals.push({ kind: "DEPOSIT_MISSING", missing: order.depositAmount - order.paidAmount });
  }
  if (!cancelled && !allDone) {
    const stalled = order.items
      .filter((item) => item.status !== "COMPLETED")
      .map((item) => ({ item, days: daysBetween(toShopDayKey(new Date(item.stageSince)), todayKey) }))
      .sort((a, b) => b.days - a.days)[0];
    if (stalled && stalled.days >= STALL_DAYS) signals.push({ kind: "STALLED", days: stalled.days, stage: stalled.item.status });
  }
  if (!cancelled && allDone && (order.orderStatus === "CONFIRMED" || order.orderStatus === "IN_PRODUCTION")) {
    signals.push({ kind: "WAITING_PACK" });
  }

  const blocking = signals.some((signal) => signal.kind !== "WAITING_PACK");
  // Đơn hủy luôn cần xử lý (dừng may); xong xưởng thì sang nhóm chờ đóng gói dù còn thiếu tiền
  const urgency: TailoringUrgency = cancelled
    ? "ACT"
    : allDone
      ? "DONE"
      : blocking || dueState === "OVERDUE" || dueState === "AT_RISK"
        ? "ACT"
        : dueState === "DUE_SOON"
          ? "SOON"
          : "ON_TRACK";

  return { urgency, dueState, daysLeft, workLeft, slowestStage, signals };
}

/** Xếp trong cùng nhóm: hẹn gần trước, chưa hẹn xuống cuối */
export function compareByDue(a: TailoringOrder, b: TailoringOrder): number {
  if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
  if (a.dueDate) return -1;
  if (b.dueDate) return 1;
  return a.createdAt.localeCompare(b.createdAt);
}
