"use client";

import { useState } from "react";
import Image from "next/image";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { CalendarDays, Eye, Package, X } from "lucide-react";
import { type DateRange } from "react-day-picker";
import { formatVnd, type Locale } from "@repo/shared";
import { Calendar } from "@/components/ui/calendar";
import { ActionButton } from "@/components/shared/ActionButton";
import { AppDialog } from "@/components/shared/AppDialog";
import { AppPopover } from "@/components/shared/AppPopover";
import { ChoiceGroup } from "@/components/shared/ChoiceGroup";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";
import { mockOrders } from "../../data/mockProfile";
import { useOrderHistory } from "../../hooks/useProfile";
import { type Order } from "../../types/profile.types";
import { ProfileSection } from "../ProfileSection";

type StatusFilter = "all" | Order["status"];

const STATUS_FILTERS: StatusFilter[] = ["all", "pending", "processing", "shipped", "delivered", "cancelled"];

const STATUS_KEY: Record<Order["status"], string> = {
  pending: "statusPending",
  processing: "statusProcessing",
  shipped: "statusShipped",
  delivered: "statusDelivered",
  cancelled: "statusCancelled",
};

/* Nhãn trạng thái: chấm màu + chữ — phân biệt được cả khi không nhìn màu */
const STATUS_TONE: Record<Order["status"], { text: string; dot: string }> = {
  pending: { text: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
  processing: { text: "text-sky-700 dark:text-sky-400", dot: "bg-sky-500" },
  shipped: { text: "text-indigo-700 dark:text-indigo-400", dot: "bg-indigo-500" },
  delivered: { text: "text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  cancelled: { text: "text-[var(--text-light)]", dot: "bg-[var(--text-light)]" },
};

const toDate = (iso: string) => new Date(`${iso}T00:00:00`);

function inRange(order: Order, range?: DateRange) {
  if (!range?.from) return true;
  const time = toDate(order.date).getTime();
  const from = new Date(range.from).setHours(0, 0, 0, 0);
  const to = new Date(range.to ?? range.from).setHours(23, 59, 59, 999);
  return time >= from && time <= to;
}

function StatusBadge({ status, label }: { status: Order["status"]; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[1.5px]", STATUS_TONE[status].text)}>
      <span aria-hidden="true" className={cn("size-1.5 rounded-full", STATUS_TONE[status].dot)} />
      {label}
    </span>
  );
}

/**
 * Lịch sử đơn hàng (dữ liệu mẫu — chưa có API đơn hàng):
 * lọc theo trạng thái (kèm số lượng) + khoảng ngày đặt; mỗi đơn là một thẻ (mã · ngày · trạng thái · ảnh sản phẩm · tổng tiền);
 * "Chi tiết" mở hộp thoại liệt kê sản phẩm.
 */
export function OrderHistoryTab() {
  const t = useTranslations("ProfilePage.orders");
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const { selectedOrder, setSelectedOrder } = useOrderHistory();
  const [status, setStatus] = useState<StatusFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();

  const formatDate = (date: Date) => format.dateTime(date, { day: "2-digit", month: "2-digit", year: "numeric" });
  const statusLabel = (value: StatusFilter) => (value === "all" ? t("statusAll") : t(STATUS_KEY[value]));

  const ordersInRange = mockOrders.filter((order) => inRange(order, dateRange));
  const visible = ordersInRange.filter((order) => status === "all" || order.status === status);
  const countOf = (value: StatusFilter) =>
    value === "all" ? ordersInRange.length : ordersInRange.filter((order) => order.status === value).length;

  const rangeLabel = dateRange?.from
    ? `${formatDate(dateRange.from)} – ${dateRange.to ? formatDate(dateRange.to) : "…"}`
    : t("selectDateRange");

  return (
    <>
      <ProfileSection flush>
        {/* Bộ lọc */}
        <div className="space-y-4 border-b border-[var(--border)] px-5 py-4 sm:px-6">
          <div className="-mx-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ChoiceGroup<StatusFilter>
              label={t("status")}
              variant="chip"
              value={status}
              onChange={setStatus}
              className="[&>div]:flex-nowrap [&_label]:shrink-0"
              options={STATUS_FILTERS.map((value) => ({ value, label: `${statusLabel(value)} (${countOf(value)})` }))}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="mr-1 text-[11px] font-semibold uppercase tracking-[2px] text-[var(--text-light)]">{t("dateFilter")}</span>
            <AppPopover
              title={t("dateFilter")}
              align="start"
              width={320}
              nativeButton
              trigger={
                <ActionButton variant={dateRange?.from ? "dialog" : "cancel"} size="sm" icon={<CalendarDays />} className="normal-case tracking-normal">
                  {rangeLabel}
                </ActionButton>
              }
            >
              <div className="flex justify-center p-2">
                <Calendar mode="range" selected={dateRange} onSelect={setDateRange} disabled={{ after: new Date() }} />
              </div>
            </AppPopover>
            {dateRange?.from ? (
              <ActionButton variant="cancel" size="sm" icon={<X />} onClick={() => setDateRange(undefined)} aria-label={t("clearDateFilter")}>
                {t("clearDateFilter")}
              </ActionButton>
            ) : null}
          </div>
        </div>

        {/* Danh sách đơn */}
        {visible.length === 0 ? (
          <EmptyState
            icon={Package}
            title={mockOrders.length ? t("emptyFiltered") : t("empty")}
            description={t("subtitle")}
            action={mockOrders.length ? t("showAll") : t("shopNow")}
            {...(mockOrders.length
              ? {
                  onAction: () => {
                    setStatus("all");
                    setDateRange(undefined);
                  },
                }
              : { href: "/products" })}
            className="py-12"
          />
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {visible.map((order) => {
              const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);
              return (
                <li key={order.id} className="px-5 py-5 sm:px-6">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
                    <p className="text-[13px] text-[var(--text-light)]">
                      <span className="font-semibold text-[var(--primary-ink)]">#{order.id}</span>
                      {" · "}
                      {formatDate(toDate(order.date))}
                    </p>
                    <StatusBadge status={order.status} label={t(STATUS_KEY[order.status])} />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4">
                    <div className="flex -space-x-3">
                      {order.items.slice(0, 3).map((item, index) => (
                        <span key={index} className="relative size-14 overflow-hidden border-2 border-[var(--bg-card)] bg-[var(--bg-main)]">
                          <Image src={item.image} alt={item.name[locale]} fill sizes="56px" className="object-cover" unoptimized />
                        </span>
                      ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-[family-name:var(--font-playfair)] text-[15px] font-semibold text-[var(--text-main)]">
                        {order.items[0]?.name[locale]}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--text-light)]">{t("itemCount", { count: itemCount })}</p>
                    </div>
                    <div className="flex w-full items-center justify-between gap-4 sm:w-auto sm:justify-end">
                      <div className="text-right">
                        <p className="text-[11px] uppercase tracking-[1.5px] text-[var(--text-light)]">{t("total")}</p>
                        <p className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[var(--primary-ink)] [font-variant-numeric:lining-nums]">
                          {formatVnd(order.total, locale)}
                        </p>
                      </div>
                      <ActionButton variant="dialog" size="sm" icon={<Eye />} onClick={() => setSelectedOrder(order)}>
                        {t("viewDetail")}
                      </ActionButton>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </ProfileSection>

      {/* Chi tiết đơn */}
      <AppDialog
        open={selectedOrder !== null}
        onOpenChange={(open) => !open && setSelectedOrder(null)}
        icon={Package}
        title={selectedOrder ? t("detailTitle", { id: selectedOrder.id }) : ""}
        description={selectedOrder ? formatDate(toDate(selectedOrder.date)) : undefined}
        size="md"
        cancel={false}
        footer={
          selectedOrder ? (
            <div className="flex w-full items-center justify-between gap-4">
              <StatusBadge status={selectedOrder.status} label={t(STATUS_KEY[selectedOrder.status])} />
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-[1.5px] text-[var(--text-light)]">{t("total")}</p>
                <p className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[var(--primary-ink)] [font-variant-numeric:lining-nums]">
                  {formatVnd(selectedOrder.total, locale)}
                </p>
              </div>
            </div>
          ) : null
        }
      >
        {selectedOrder ? (
          <ul className="divide-y divide-[var(--border)] border-y border-[var(--border)]">
            {selectedOrder.items.map((item, index) => (
              <li key={index} className="flex items-center gap-4 py-3">
                <span className="relative size-16 shrink-0 overflow-hidden bg-[var(--bg-main)]">
                  <Image src={item.image} alt={item.name[locale]} fill sizes="64px" className="object-cover" unoptimized />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-[family-name:var(--font-playfair)] text-[15px] font-semibold text-[var(--text-main)]">
                    {item.name[locale]}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--text-light)]">
                    {formatVnd(item.price, locale)} · {t("quantity", { count: item.quantity })}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-[var(--text-main)] [font-variant-numeric:lining-nums]">
                  {formatVnd(item.price * item.quantity, locale)}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </AppDialog>

    </>
  );
}

