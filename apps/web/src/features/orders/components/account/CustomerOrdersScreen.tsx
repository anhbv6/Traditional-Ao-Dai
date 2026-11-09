"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Package, Scissors } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { CUSTOMER_ORDER_FILTERS, type CustomerOrderStage, type CustomerOrderSummaryDto } from "@repo/shared/orders";
import { ActionButton } from "@/components/shared/ActionButton";
import { EmptyState } from "@/components/shared/EmptyState";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useMyOrders } from "../../hooks/useMyOrders";

/* Chấm màu + chữ cho từng nhóm (phân biệt được cả khi không nhìn màu) — chỉ dùng token */
const STAGE_DOT: Record<CustomerOrderStage, string> = {
  AWAITING_PAYMENT: "bg-(--accent-color)",
  PROCESSING: "bg-(--primary-color)/60",
  TAILORING: "bg-(--primary-color)",
  SHIPPING: "bg-(--primary-ink)",
  COMPLETED: "bg-(--success)",
  CANCELLED: "bg-(--text-light)",
};

function OrderCard({ order }: { order: CustomerOrderSummaryDto }) {
  const t = useTranslations("OrdersPage");
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const vnd = (value: number) => formatVnd(value, locale);

  return (
    <li className="border border-(--border) bg-(--bg-card)">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-(--border) px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-mono text-sm font-semibold tracking-wider text-(--primary-ink)">{order.orderCode}</span>
          <span className="text-xs tabular-nums text-(--text-light)">
            {format.dateTime(new Date(order.createdAt), { day: "2-digit", month: "2-digit", year: "numeric" })}
          </span>
          {order.isTailored ? (
            <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-[1.5px] text-(--text-light)">
              <Scissors size={11} aria-hidden="true" /> {t("account.tailored")}
            </span>
          ) : null}
        </div>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[1.5px] text-(--text-main)">
          <span aria-hidden="true" className={cn("size-1.5 rounded-full", STAGE_DOT[order.stage])} />
          {t(`stage.${order.stage}`)}
        </span>
      </div>

      <div className="flex flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <div className="flex shrink-0 -space-x-3">
            {order.previewImages.map((src, index) => (
              <Image
                key={`${src}-${index}`}
                src={src}
                alt=""
                width={48}
                height={64}
                className="aspect-3/4 w-12 border-2 border-(--bg-card) object-cover"
              />
            ))}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{order.firstItemName}</p>
            <p className="text-xs text-(--text-light)">{t("account.itemCount", { count: order.itemCount })}</p>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-3 text-xs sm:w-auto sm:min-w-[300px]">
          <div>
            <dt className="text-(--text-light)">{t("amounts.total")}</dt>
            <dd className="mt-0.5 text-sm font-semibold tabular-nums">{vnd(order.amounts.totalAmount)}</dd>
          </div>
          <div>
            <dt className="text-(--text-light)">{t("amounts.paid")}</dt>
            <dd className="mt-0.5 tabular-nums">{vnd(order.amounts.paidAmount)}</dd>
          </div>
          <div>
            <dt className="text-(--text-light)">{t("amounts.balance")}</dt>
            <dd className="mt-0.5 font-semibold tabular-nums text-(--primary-ink)">{vnd(order.amounts.balanceDue)}</dd>
          </div>
        </dl>

        <Link
          href={`/my-orders/${order.orderCode}`}
          className="inline-flex shrink-0 items-center justify-center gap-1 border border-(--border) px-4 py-2 text-[11px] font-semibold uppercase tracking-[1.5px] text-(--primary-ink) transition-colors hover:border-(--primary-color) focus-visible:outline-2 focus-visible:outline-(--ring)"
        >
          {order.isTailored ? t("account.viewTimeline") : t("account.detail")}
          <ChevronRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </li>
  );
}

/**
 * "Đơn hàng của tôi" — thay tab đơn hàng mock cũ: dữ liệu thật qua API (React Query), lọc theo 7 nhóm trạng thái
 * (kèm số đơn mỗi nhóm), phân trang. Mỗi thẻ: mã · ngày · nhóm · ảnh · tổng / đã trả / còn lại → chi tiết + timeline.
 */
export function CustomerOrdersScreen() {
  const t = useTranslations("OrdersPage");
  const { filter, setFilter, page, setPage, orders, meta, isLoading, isError, refetch } = useMyOrders();
  const counts = meta?.counts ?? {};

  return (
    <div className="space-y-5">
      <div role="tablist" aria-label={t("account.filtersLabel")} className="-mx-1 flex gap-1 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CUSTOMER_ORDER_FILTERS.map((value) => {
          const isActive = value === filter;
          return (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setFilter(value)}
              className={cn(
                "shrink-0 cursor-pointer whitespace-nowrap border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[1.5px] transition-colors focus-visible:outline-2 focus-visible:outline-(--ring)",
                isActive
                  ? "border-(--primary-color) bg-(--primary-color) text-white"
                  : "border-(--border) text-(--text-light) hover:text-(--primary-ink)"
              )}
            >
              {t(`stage.${value}`)}
              <span className="ml-1.5 tabular-nums opacity-70">{counts[value] ?? 0}</span>
            </button>
          );
        })}
      </div>

      {isError ? (
        <div className="border border-(--border) p-6 text-center text-sm">
          <p>{t("account.loadError")}</p>
          <ActionButton variant="cancel" size="sm" className="mt-3" onClick={() => void refetch()}>
            {t("account.retry")}
          </ActionButton>
        </div>
      ) : isLoading ? (
        <div className="animate-pulse space-y-3" aria-hidden="true">
          {[0, 1, 2].map((key) => (
            <div key={key} className="h-36 bg-(--bg-secondary)" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        filter === "ALL" ? (
          <EmptyState
            icon={Package}
            title={t("account.empty.title")}
            description={t("account.empty.description")}
            action={t("account.empty.action")}
            href="/products"
            secondaryAction={{ label: t("account.empty.track"), href: "/track-order" }}
          />
        ) : (
          <p className="border border-dashed border-(--border) p-8 text-center text-sm text-(--text-light)">{t("account.emptyFilter")}</p>
        )
      ) : (
        <ul className="space-y-4">
          {orders.map((order) => (
            <OrderCard key={order.orderCode} order={order} />
          ))}
        </ul>
      )}

      {meta && meta.totalPages > 1 ? (
        <nav aria-label={t("account.pagination")} className="flex items-center justify-center gap-3">
          <ActionButton variant="cancel" size="sm" icon={<ChevronLeft />} disabled={page <= 1} onClick={() => setPage(page - 1)}>
            {t("account.previous")}
          </ActionButton>
          <span className="text-xs tabular-nums text-(--text-light)">{t("account.pageOf", { page, total: meta.totalPages })}</span>
          <ActionButton
            variant="cancel"
            size="sm"
            icon={<ChevronRight />}
            iconPosition="end"
            disabled={page >= meta.totalPages}
            onClick={() => setPage(page + 1)}
          >
            {t("account.next")}
          </ActionButton>
        </nav>
      ) : null}
    </div>
  );
}
