"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { ArrowRight, Ban, Banknote, Check, MoreHorizontal, Phone, Scissors, Shirt } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { buildTransferContent } from "@repo/shared/orders";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  ADMIN_SECONDARY_BUTTON_CLASS,
  AdminDetailHeader,
} from "@/features/admin/core/ui";
import { useOrderActions } from "../../hooks/useOrderActions";
import { type AdminOrderDetail } from "../../types/orders.types";
import { applyOrderPatch } from "../../utils/applyOrderPatch";
import { isWorkshopDone, nextOrderStatus } from "../../utils/orderFlow";
import { NextStepText, OrderStatusText, SHOP_TIME_ZONE, useVnd } from "../shared/OrderParts";

const RecordPaymentDialog = dynamic(() => import("../shared/RecordPaymentDialog").then((m) => m.RecordPaymentDialog));
const RequestCancelDialog = dynamic(() => import("../shared/RequestCancelDialog").then((m) => m.RequestCancelDialog));

function Card({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5")}>
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#09090B]">{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

function InfoRow({ label, children, strong }: { label: string; children: ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-[#71717A]">{label}</span>
      <span className={cn("min-w-0 text-right", strong ? "font-semibold text-[#09090B]" : "text-[#3F3F46]")}>{children}</span>
    </div>
  );
}

/** Các bước vòng đời hiển thị — đơn may sẵn bỏ bước "may" */
const FLOW = ["PENDING", "CONFIRMED", "IN_PRODUCTION", "READY_TO_SHIP", "SHIPPING", "DELIVERED"] as const;

/**
 * Chi tiết đơn: thanh đầu có bước kế (nút chính) + ghi nhận tiền + menu; tiến trình vòng đời, các món;
 * cột phải là thanh toán (kèm nội dung chuyển khoản để đối soát) và khách / giao hàng.
 */
export function OrderDetail({ data }: { data: AdminOrderDetail }) {
  const t = useTranslations("AdminPage.orders");
  const tTailoring = useTranslations("AdminPage.tailoring");
  const format = useFormatter();
  const vnd = useVnd();
  const [order, setOrder] = useState(data);
  const [dialog, setDialog] = useState<"payment" | "cancel" | null>(null);
  const { advance, recordPayment, requestCancel } = useOrderActions((patch) => {
    setOrder((prev) => applyOrderPatch(prev, patch));
    setDialog(null);
  });

  const closed = order.orderStatus === "CANCELLED" || order.orderStatus === "REFUNDED";
  const next = nextOrderStatus(order.orderStatus, isWorkshopDone(order));
  const remaining = Math.max(0, order.totalAmount - order.paidAmount);
  const flow = FLOW.filter((status) => order.isTailored || status !== "IN_PRODUCTION");
  const currentIndex = flow.indexOf(order.orderStatus as (typeof FLOW)[number]);
  const dateTime = (iso: string) =>
    format.dateTime(new Date(iso), { day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: SHOP_TIME_ZONE });

  const menuItems: AppMenuEntry[] = [
    ...(order.isTailored ? [{ key: "tailoring", label: t("menu.tailoring"), icon: Scissors, href: `/admin/tailoring/${order.id}` }] : []),
    ...(!closed && order.orderStatus !== "DELIVERED"
      ? [
          {
            key: "cancel",
            label: t("menu.requestCancel"),
            description: order.pendingApproval ? t("menu.cancelPending") : undefined,
            icon: Ban,
            tone: "danger" as const,
            disabled: Boolean(order.pendingApproval),
            onSelect: () => setDialog("cancel"),
          },
        ]
      : []),
  ];

  return (
    <>
      <AdminDetailHeader
        backHref="/admin/orders"
        backLabel={t("detail.back")}
        title={order.orderNumber}
        badge={<OrderStatusText status={order.orderStatus} />}
        subtitle={`${order.customerName} · ${t("detail.placedAt", { date: dateTime(order.createdAt) })}`}
        actions={
          <>
            {!closed && remaining > 0 && (
              <button type="button" onClick={() => setDialog("payment")} className={ADMIN_SECONDARY_BUTTON_CLASS}>
                <Banknote size={15} aria-hidden /> {t("menu.recordPayment")}
              </button>
            )}
            {next && (
              <button
                type="button"
                disabled={advance.isPending || Boolean(order.pendingApproval)}
                onClick={() => advance.mutate({ orderId: order.id, status: next })}
                className={ADMIN_PRIMARY_BUTTON_CLASS}
              >
                {t(`action.${next}`)} <ArrowRight size={15} aria-hidden />
              </button>
            )}
            {menuItems.length > 0 && (
              <AppMenu
                tone="admin"
                width={232}
                align="end"
                sideOffset={4}
                items={menuItems}
                trigger={
                  <button type="button" aria-label={t("detail.more")} className={cn(ADMIN_SECONDARY_BUTTON_CLASS, "w-9 px-0")}>
                    <MoreHorizontal size={16} />
                  </button>
                }
              />
            )}
          </>
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <Card title={t("detail.progress")} aside={<NextStepText order={order} className="text-right" />}>
            {closed ? (
              <p className="text-sm text-[#71717A]">{t(`detail.closed.${order.orderStatus}`)}</p>
            ) : (
              <ol className="grid grid-cols-3 gap-x-2 gap-y-4 sm:grid-cols-6">
                {flow.map((status, index) => {
                  const state = index < currentIndex ? "done" : index === currentIndex ? "current" : "todo";
                  return (
                    <li key={status} className="min-w-0">
                      <span
                        className={cn(
                          "block h-1.5 rounded-full",
                          state === "done" ? "bg-[#18181B]" : state === "current" ? (status === "DELIVERED" ? "bg-emerald-500" : "bg-[#18181B]/45") : "bg-[#E4E4E7]"
                        )}
                      />
                      <span
                        className={cn(
                          "mt-1.5 flex items-center gap-1 text-xs",
                          state === "current" ? "font-medium text-[#09090B]" : state === "done" ? "text-[#3F3F46]" : "text-[#A1A1AA]"
                        )}
                      >
                        {state === "done" && <Check size={12} aria-hidden className="shrink-0" />}
                        <span className="truncate">{t(`status.${status}`)}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
            {order.pendingApproval && <p className="mt-4 text-xs text-amber-700">{t("next.APPROVAL_PENDING")}</p>}
          </Card>

          <Card title={t("detail.items", { count: order.itemCount })}>
            <ul className="divide-y divide-dashed divide-[#E4E4E7]">
              {order.lines.map((line) => (
                <li key={line.id} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                  <span className="grid aspect-[3/4] w-12 shrink-0 place-items-center overflow-hidden rounded-lg bg-[#F4F4F5] ring-1 ring-[#E4E4E7]/70">
                    {line.image ? (
                      // eslint-disable-next-line @next/next/no-img-element -- ảnh sản phẩm do admin nhập (URL tùy ý), không qua next/image
                      <img src={line.image} alt="" className="size-full object-contain" />
                    ) : (
                      <Shirt size={16} className="text-[#A1A1AA]" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-body font-medium text-[#09090B]">{line.productName}</p>
                      <p className="shrink-0 font-mono text-sm font-semibold tabular-nums text-[#09090B]">{vnd(line.totalPrice)}</p>
                    </div>
                    {(line.variantName || line.sku) && (
                      <p className="mt-0.5 text-xs text-[#71717A]">
                        {line.variantName}
                        {line.variantName && line.sku && " · "}
                        {line.sku && <span className="font-mono text-2xs">{line.sku}</span>}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-[#71717A]">
                      {t("detail.qtyPrice", { qty: line.quantity, price: vnd(line.unitPrice) })}
                      {line.isCustomFit && (
                        <>
                          {" · "}
                          <Link href={`/admin/tailoring/${order.id}`} className="inline-flex items-center gap-1 text-[#3F3F46] hover:underline">
                            <Scissors size={11} aria-hidden />
                            {line.tailoringStatus === "NOT_APPLICABLE"
                              ? tTailoring("stage.WAITING_FABRIC")
                              : tTailoring(`stage.${line.tailoringStatus}`)}
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-28">
          <Card title={t("detail.payment")}>
            <div className="space-y-2.5">
              <InfoRow label={t("detail.subTotal")}>{vnd(order.subTotal)}</InfoRow>
              {order.discountAmount > 0 && <InfoRow label={t("detail.discount")}>−{vnd(order.discountAmount)}</InfoRow>}
              <InfoRow label={t("detail.shippingFee")}>{vnd(order.shippingFee)}</InfoRow>
              <InfoRow label={t("detail.total")} strong>
                {vnd(order.totalAmount)}
              </InfoRow>
              <div className="space-y-2.5 border-t border-dashed border-[#E4E4E7] pt-2.5">
                <InfoRow label={t("detail.method")}>
                  {t.has(`method.${order.paymentMethod}`) ? t(`method.${order.paymentMethod}`) : order.paymentMethod}
                </InfoRow>
                {order.depositAmount > 0 && <InfoRow label={t("detail.deposit")}>{vnd(order.depositAmount)}</InfoRow>}
                <InfoRow label={t("detail.paid")}>{vnd(order.paidAmount)}</InfoRow>
                <InfoRow label={t("detail.remaining")} strong>
                  <span className={cn(remaining > 0 && !closed ? "text-amber-700" : "text-emerald-700")}>{vnd(remaining)}</span>
                </InfoRow>
              </div>
            </div>
            {!closed && remaining > 0 && order.paymentMethod !== "COD" && (
              <p className="mt-4 rounded-lg bg-[#FAFAFA] px-3 py-2 text-xs text-[#71717A]">
                {t("detail.transferContent")}{" "}
                <span className="font-mono text-2xs font-semibold text-[#09090B]">{buildTransferContent(order.orderNumber)}</span>
              </p>
            )}
          </Card>

          <Card title={t("detail.customer")}>
            <div className="space-y-2.5">
              <InfoRow label={t("detail.name")}>{order.customerName}</InfoRow>
              <InfoRow label={t("detail.phone")}>
                <a href={`tel:${order.customerPhone}`} className="inline-flex items-center gap-1 font-mono hover:underline">
                  <Phone size={12} aria-hidden /> {order.customerPhone}
                </a>
              </InfoRow>
              <InfoRow label={t("detail.email")}>
                <span className="break-all">{order.customerEmail}</span>
              </InfoRow>
              <InfoRow label={t("detail.address")}>{order.shippingAddress}</InfoRow>
              {order.dueDate && (
                <InfoRow label={t("detail.dueDate")}>
                  {format.dateTime(new Date(order.dueDate), { weekday: "short", day: "numeric", month: "numeric", timeZone: SHOP_TIME_ZONE })}
                </InfoRow>
              )}
              {order.createdByName && <InfoRow label={t("detail.createdBy")}>{order.createdByName}</InfoRow>}
            </div>
            {order.note && <p className="mt-4 rounded-lg bg-[#FAFAFA] px-3 py-2 text-sm text-[#3F3F46]">{order.note}</p>}
          </Card>
        </aside>
      </div>

      {dialog === "payment" && (
        <RecordPaymentDialog
          order={order}
          pending={recordPayment.isPending}
          onOpenChange={(open) => !open && setDialog(null)}
          onSubmit={(input) => recordPayment.mutate({ orderId: order.id, ...input })}
        />
      )}
      {dialog === "cancel" && (
        <RequestCancelDialog
          order={order}
          pending={requestCancel.isPending}
          onOpenChange={(open) => !open && setDialog(null)}
          onSubmit={(reason) => requestCancel.mutate({ orderId: order.id, reason })}
        />
      )}
    </>
  );
}
