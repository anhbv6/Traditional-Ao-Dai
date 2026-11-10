"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { type OrderStatus } from "@repo/shared/orders";
import { cn } from "@/lib/utils";
import { AdminStatusText, type AdminStatusTone } from "@/features/admin/core/ui";
import { type AdminOrderRow } from "../../types/orders.types";
import { resolveNextStep, type NextStep } from "../../utils/orderFlow";

/** Giờ tiệm cho ngày giờ đặt / hẹn */
export const SHOP_TIME_ZONE = "Asia/Ho_Chi_Minh";

const STATUS_TONE: Record<OrderStatus, AdminStatusTone> = {
  PENDING: "warning",
  CONFIRMED: "neutral",
  IN_PRODUCTION: "neutral",
  READY_TO_SHIP: "neutral",
  SHIPPING: "neutral",
  DELIVERED: "success",
  CANCELLED: "danger",
  REFUNDED: "neutral",
};

export function OrderStatusText({ status }: { status: OrderStatus }) {
  const t = useTranslations("AdminPage.orders");
  return <AdminStatusText tone={STATUS_TONE[status]}>{t(`status.${status}`)}</AdminStatusText>;
}

export function useVnd() {
  const locale = useLocale() as Locale;
  return (amount: number) => formatVnd(amount, locale);
}

const STEP_CLASS: Record<NextStep["tone"], string> = {
  warning: "text-amber-700",
  neutral: "text-[#71717A]",
  success: "text-emerald-700",
  muted: "text-[#A1A1AA]",
};

/** Câu "việc kế tiếp" của đơn — chữ nhỏ dưới trạng thái, chỉ đổi màu chữ theo mức độ */
export function NextStepText({ order, className }: { order: AdminOrderRow; className?: string }) {
  const t = useTranslations("AdminPage.orders");
  const tTailoring = useTranslations("AdminPage.tailoring");
  const format = useFormatter();
  const vnd = useVnd();
  const step = resolveNextStep(order);
  const due = order.dueDate
    ? format.dateTime(new Date(order.dueDate), { day: "numeric", month: "numeric", timeZone: SHOP_TIME_ZONE })
    : null;

  let text: string;
  switch (step.kind) {
    case "AWAIT_TRANSFER":
    case "COLLECT_ON_DELIVERY":
    case "COLLECT_REMAINING":
      text = t(`next.${step.kind}`, { amount: vnd(step.amount) });
      break;
    case "WORKSHOP":
      text = due
        ? t("next.WORKSHOP_DUE", { stage: tTailoring(`stage.${step.stage}`), date: due })
        : t("next.WORKSHOP", { stage: tTailoring(`stage.${step.stage}`) });
      break;
    default:
      text = t(`next.${step.kind}`);
  }
  return <p className={cn("text-xs leading-relaxed", STEP_CLASS[step.tone], className)}>{text}</p>;
}

/** Tổng tiền + đã thu / còn lại (dòng phụ) */
export function OrderMoney({ order, align = "right" }: { order: AdminOrderRow; align?: "left" | "right" }) {
  const t = useTranslations("AdminPage.orders");
  const vnd = useVnd();
  const closed = order.orderStatus === "CANCELLED" || order.orderStatus === "REFUNDED";
  const remaining = Math.max(0, order.totalAmount - order.paidAmount);
  return (
    <div className={cn("whitespace-nowrap", align === "right" && "text-right")}>
      <p className={cn("font-mono text-body font-semibold tabular-nums", closed ? "text-[#A1A1AA] line-through" : "text-[#09090B]")}>
        {vnd(order.totalAmount)}
      </p>
      <p className="mt-0.5 text-xs text-[#71717A]">
        {order.paymentStatus === "REFUNDED"
          ? t("payment.REFUNDED")
          : remaining === 0
            ? <span className="text-emerald-700">{t("money.paidFull")}</span>
            : order.paidAmount > 0
              ? t("money.paidPart", { paid: vnd(order.paidAmount) })
              : t("money.unpaid")}
        {" · "}
        {t.has(`method.${order.paymentMethod}`) ? t(`method.${order.paymentMethod}`) : order.paymentMethod}
      </p>
    </div>
  );
}
