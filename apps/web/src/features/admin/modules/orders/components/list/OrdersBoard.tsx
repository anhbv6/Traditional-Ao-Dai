"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowRight, Ban, Banknote, Eye, MoreHorizontal, Scissors, ShoppingBag } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { AppMenu, type AppMenuEntry } from "@/components/shared/AppMenu";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_ROW_ICON_BUTTON_CLASS,
  AdminDataTable,
  AdminFilterSelect,
  AdminListPanel,
  type AdminTableColumn,
} from "@/features/admin/core/ui";
import { useOrderActions } from "../../hooks/useOrderActions";
import { ORDER_TABS, type AdminOrderRow, type AdminOrdersData, type OrderTab } from "../../types/orders.types";
import { applyOrderPatch } from "../../utils/applyOrderPatch";
import { isWorkshopDone, nextOrderStatus, orderTabOf } from "../../utils/orderFlow";
import { NextStepText, OrderMoney, OrderStatusText, SHOP_TIME_ZONE } from "../shared/OrderParts";

const RecordPaymentDialog = dynamic(() => import("../shared/RecordPaymentDialog").then((m) => m.RecordPaymentDialog));
const RequestCancelDialog = dynamic(() => import("../shared/RequestCancelDialog").then((m) => m.RequestCancelDialog));

type KindFilter = "ALL" | "READY_MADE" | "TAILORED";
type PaymentFilter = "ALL" | "UNPAID" | "PARTIALLY_PAID" | "PAID" | "REFUNDED";
type DialogState = { kind: "payment" | "cancel"; orderId: string } | null;

/**
 * Màn danh sách đơn hàng: tab theo vòng đời (kèm số đơn), bảng chuẩn admin, mỗi dòng có trạng thái + "việc kế tiếp"
 * (chờ chuyển khoản, xưởng đang ở đâu, thu COD...) để biết phải làm gì mà không cần mở từng đơn.
 * Menu ⋯: bước kế, ghi nhận tiền, phiếu may, yêu cầu hủy (qua phê duyệt). Chi tiết ở /admin/orders/[id].
 */
export function OrdersBoard({ data }: { data: AdminOrdersData }) {
  const t = useTranslations("AdminPage.orders");
  const tPage = useTranslations("AdminPage.pages.orders");
  const format = useFormatter();
  const [orders, setOrders] = useState(data.orders);
  const [tab, setTab] = useState<OrderTab>("ALL");
  const [kind, setKind] = useState<KindFilter>("ALL");
  const [payment, setPayment] = useState<PaymentFilter>("ALL");
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<DialogState>(null);

  const { advance, recordPayment, requestCancel } = useOrderActions((patch) => {
    setOrders((prev) => prev.map((order) => applyOrderPatch(order, patch)));
    setDialog(null);
  });

  const keyword = search.trim().toLowerCase();
  const filtered = orders.filter(
    (order) =>
      (kind === "ALL" || order.isTailored === (kind === "TAILORED")) &&
      (payment === "ALL" || order.paymentStatus === payment) &&
      (!keyword ||
        [order.orderNumber, order.customerName, order.customerPhone, order.firstItemName].some((value) =>
          value.toLowerCase().includes(keyword)
        ))
  );
  const counts = Object.fromEntries(
    ORDER_TABS.map((value) => [value, value === "ALL" ? filtered.length : filtered.filter((order) => orderTabOf(order.orderStatus) === value).length])
  ) as Record<OrderTab, number>;
  const rows = tab === "ALL" ? filtered : filtered.filter((order) => orderTabOf(order.orderStatus) === tab);

  const dialogOrder = dialog ? orders.find((order) => order.id === dialog.orderId) : undefined;
  const closed = (order: AdminOrderRow) => order.orderStatus === "CANCELLED" || order.orderStatus === "REFUNDED";

  const menuItems = (order: AdminOrderRow): AppMenuEntry[] => {
    const next = nextOrderStatus(order.orderStatus, isWorkshopDone(order));
    const remaining = order.totalAmount - order.paidAmount;
    return [
      { key: "view", label: t("menu.view"), icon: Eye, href: `/admin/orders/${order.id}` },
      ...(next
        ? [
            {
              key: "advance",
              label: t(`action.${next}`),
              icon: ArrowRight,
              disabled: advance.isPending || Boolean(order.pendingApproval),
              onSelect: () => advance.mutate({ orderId: order.id, status: next }),
            },
          ]
        : []),
      ...(!closed(order) && remaining > 0
        ? [{ key: "payment", label: t("menu.recordPayment"), icon: Banknote, onSelect: () => setDialog({ kind: "payment", orderId: order.id }) }]
        : []),
      ...(order.isTailored ? [{ key: "tailoring", label: t("menu.tailoring"), icon: Scissors, href: `/admin/tailoring/${order.id}` }] : []),
      ...(!closed(order) && order.orderStatus !== "DELIVERED"
        ? [
            { type: "separator" as const, key: "sep" },
            {
              key: "cancel",
              label: t("menu.requestCancel"),
              description: order.pendingApproval ? t("menu.cancelPending") : undefined,
              icon: Ban,
              tone: "danger" as const,
              disabled: Boolean(order.pendingApproval),
              onSelect: () => setDialog({ kind: "cancel", orderId: order.id }),
            },
          ]
        : []),
    ];
  };

  const orderCell = (order: AdminOrderRow) => (
    <div className="min-w-0">
      <Link href={`/admin/orders/${order.id}`} className="font-mono text-sm font-semibold text-[#09090B] hover:underline">
        {order.orderNumber}
      </Link>
      <p className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-xs text-[#71717A]">
        <time dateTime={order.createdAt}>
          {format.dateTime(new Date(order.createdAt), { day: "numeric", month: "numeric", hour: "2-digit", minute: "2-digit", timeZone: SHOP_TIME_ZONE })}
        </time>
        {order.isTailored && (
          <>
            <span aria-hidden>·</span>
            <Scissors size={11} aria-hidden /> {t("tailored")}
          </>
        )}
      </p>
    </div>
  );

  const customerCell = (order: AdminOrderRow) => (
    <div className="min-w-0">
      <p className="truncate text-[#09090B]">{order.customerName}</p>
      <p className="mt-0.5 font-mono text-2xs text-[#71717A]">{order.customerPhone}</p>
    </div>
  );

  const itemsCell = (order: AdminOrderRow) => (
    <div className="min-w-0">
      <p className="truncate text-[#3F3F46]">{order.firstItemName}</p>
      {order.itemCount > 1 && <p className="mt-0.5 text-xs text-[#71717A]">{t("itemCount", { count: order.itemCount })}</p>}
    </div>
  );

  const statusCell = (order: AdminOrderRow) => (
    <div className="min-w-0">
      <OrderStatusText status={order.orderStatus} />
      <NextStepText order={order} className="mt-1 pl-4" />
    </div>
  );

  const columns: AdminTableColumn<AdminOrderRow>[] = [
    { key: "order", header: t("column.order"), className: "w-48", cell: orderCell },
    { key: "customer", header: t("column.customer"), className: "hidden w-48 @4xl:table-cell", cell: customerCell },
    { key: "items", header: t("column.items"), className: "hidden max-w-60 @6xl:table-cell", cell: itemsCell },
    { key: "status", header: t("column.status"), cell: statusCell },
    { key: "money", header: t("column.money"), align: "right", className: "w-44", cell: (order) => <OrderMoney order={order} /> },
  ];

  return (
    <>
      <AdminListPanel
        icon={ShoppingBag}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: search, onChange: setSearch, placeholder: t("searchPlaceholder") }}
        filters={
          <>
            <AdminFilterSelect
              label={t("filter.kind")}
              value={kind}
              onChange={setKind}
              options={(["ALL", "READY_MADE", "TAILORED"] as const).map((value) => ({ value, label: t(`filter.kindOption.${value}`) }))}
              className="w-full sm:w-52"
            />
            <AdminFilterSelect
              label={t("filter.payment")}
              value={payment}
              onChange={setPayment}
              options={(["ALL", "UNPAID", "PARTIALLY_PAID", "PAID", "REFUNDED"] as const).map((value) => ({
                value,
                label: value === "ALL" ? t("filter.all") : t(`payment.${value}`),
              }))}
              className="w-full sm:w-60"
            />
          </>
        }
      />

      {/* Tab vòng đời — gạch chân tối giản như màn Bảng size, cuộn ngang ở màn nhỏ */}
      <div role="tablist" aria-label={t("tabsLabel")} className="-mx-1 flex gap-1 overflow-x-auto border-b border-[#E4E4E7] px-1 [scrollbar-width:none]">
        {ORDER_TABS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={cn(
              "-mb-px inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-2.5 text-body transition-colors sm:px-4",
              tab === value ? "border-[#18181B] font-semibold text-[#09090B]" : "border-transparent text-[#71717A] hover:text-[#09090B]"
            )}
          >
            {t(`tab.${value}`)}
            <span className={cn("font-mono text-xs tabular-nums", counts[value] === 0 ? "text-[#D4D4D8]" : "text-[#71717A]")}>{counts[value]}</span>
          </button>
        ))}
      </div>

      <AdminDataTable
        rows={rows}
        columns={columns}
        getRowId={(order) => order.id}
        rowActions={(order) => (
          <AppMenu
            tone="admin"
            width={240}
            align="end"
            sideOffset={4}
            items={menuItems(order)}
            trigger={
              <button type="button" aria-label={t("menu.label", { code: order.orderNumber })} className={ADMIN_ROW_ICON_BUTTON_CLASS}>
                <MoreHorizontal size={18} />
              </button>
            }
          />
        )}
        actionsLabel={t("column.actions")}
        minWidth={560}
        empty={orders.length === 0 ? t("empty") : t("noResults")}
        mobileRow={(order) => (
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-3">
              {orderCell(order)}
              <OrderMoney order={order} />
            </div>
            <p className="truncate text-sm text-[#3F3F46]">
              {order.customerName} <span className="font-mono text-2xs text-[#71717A]">{order.customerPhone}</span>
            </p>
            {statusCell(order)}
          </div>
        )}
      />

      {dialog?.kind === "payment" && dialogOrder && (
        <RecordPaymentDialog
          order={dialogOrder}
          pending={recordPayment.isPending}
          onOpenChange={(open) => !open && setDialog(null)}
          onSubmit={(input) => recordPayment.mutate({ orderId: dialogOrder.id, ...input })}
        />
      )}
      {dialog?.kind === "cancel" && dialogOrder && (
        <RequestCancelDialog
          order={dialogOrder}
          pending={requestCancel.isPending}
          onOpenChange={(open) => !open && setDialog(null)}
          onSubmit={(reason) => requestCancel.mutate({ orderId: dialogOrder.id, reason })}
        />
      )}
    </>
  );
}
