"use client";

import { type ReactNode } from "react";
import { AlertTriangle, CircleCheck, CircleX, Clock3 } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS, AdminFilterSelect } from "@/features/admin/core/ui";
import { type AdminSaleEvent, type SaleCatalogProduct, type SaleStats } from "../../types/saleEvents.types";
import { DAY_MS, HOUR_MS, SHOP_TIME_ZONE } from "../../utils/saleRules";
import { ProductThumb, RevenueBars } from "../shared/SaleParts";
import { type SaleProductRow } from "./SaleProductsCard";

export function AsideCard({ title, aside, children, className }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn(ADMIN_CARD_CLASS, "p-4 sm:p-5", className)}>
      <header className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[#09090B]">{title}</h2>
        {aside}
      </header>
      {children}
    </section>
  );
}

/**
 * Xem trước thẻ sản phẩm ở storefront — mô phỏng nơi khách thấy nên dùng token màu storefront (ngoại lệ tông đơn sắc
 * admin, AGENTS.md §8 "màn xem trước giữ kiểu của nơi được mô phỏng"): nhãn chương trình, giá gạch, % giảm, đếm ngược.
 */
export function StorefrontPreview({
  rows,
  previewId,
  onPreviewChange,
  badge,
  startAt,
  endAt,
  showCountdown,
  now,
}: {
  rows: SaleProductRow[];
  previewId: string | null;
  onPreviewChange: (id: string) => void;
  badge: string;
  startAt: string | null;
  endAt: string | null;
  showCountdown: boolean;
  now: string;
}) {
  const t = useTranslations("AdminPage.saleEvents");
  const locale = useLocale() as Locale;
  const applied = rows.filter((row) => !row.excluded);
  const row = applied.find((item) => item.product.id === previewId) ?? applied[0];

  const countdown = (() => {
    if (!showCountdown || !startAt || !endAt) return null;
    const nowMs = Date.parse(now);
    const target = Date.parse(startAt) > nowMs ? Date.parse(startAt) : Date.parse(endAt);
    const diff = Math.max(0, target - nowMs);
    const days = Math.floor(diff / DAY_MS);
    const hours = Math.floor((diff % DAY_MS) / HOUR_MS);
    return Date.parse(startAt) > nowMs ? t("preview.startsIn", { days, hours }) : t("preview.endsIn", { days, hours });
  })();

  return (
    <AsideCard title={t("preview.title")}>
      {!row ? (
        <p className="py-6 text-center text-sm text-[#71717A]">{t("preview.empty")}</p>
      ) : (
        <>
          {applied.length > 1 && (
            <AdminFilterSelect
              label={t("preview.product")}
              value={row.product.id}
              onChange={onPreviewChange}
              options={applied.map((item) => ({ value: item.product.id, label: item.product.name }))}
              className="mb-4 w-full"
            />
          )}
          <div className="mx-auto max-w-56 rounded-xl bg-(--bg-main,#FFFDF9) p-2 ring-1 ring-[#E4E4E7]">
            <div className="relative">
              <ProductThumb product={row.product} className="w-full rounded-md [&_svg]:size-10" />
              {badge && (
                <span className="absolute left-2 top-2 max-w-[80%] truncate rounded-sm bg-(--primary-color) px-2 py-0.5 text-2xs font-medium text-white">{badge}</span>
              )}
              {row.percent > 0 && (
                <span className="absolute right-2 top-2 rounded-sm bg-white/90 px-1.5 py-0.5 font-mono text-2xs font-semibold text-(--primary-color)">−{row.percent}%</span>
              )}
              {countdown && (
                <span className="absolute inset-x-2 bottom-2 inline-flex items-center justify-center gap-1 rounded-sm bg-(--bg-wine)/85 px-2 py-1 text-2xs text-white">
                  <Clock3 size={11} aria-hidden />
                  {countdown}
                </span>
              )}
            </div>
            <div className="px-1 pb-1 pt-2.5">
              <p className="truncate text-sm text-(--text-main)">{row.product.name}</p>
              <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                <span className="font-semibold text-(--primary-color)">{formatVnd(row.salePrice, locale)}</span>
                {row.salePrice < row.product.basePrice && <span className="text-xs text-(--text-light) line-through">{formatVnd(row.product.basePrice, locale)}</span>}
              </p>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-[#A1A1AA]">{t("preview.note")}</p>
        </>
      )}
    </AsideCard>
  );
}

export interface CheckItem {
  key: string;
  status: "ok" | "warn" | "block";
  label: string;
  detail?: string;
}

/** Kiểm tra trước khi công bố — dòng chặn (đỏ) phải sửa mới công bố được, dòng cảnh báo (vàng) chỉ nhắc */
export function PublishChecklist({ items, live }: { items: CheckItem[]; /** Đã công bố → "Tình trạng" thay vì "Trước khi công bố" */ live?: boolean }) {
  const t = useTranslations("AdminPage.saleEvents");
  const blocking = items.filter((item) => item.status === "block").length;
  const warnings = items.filter((item) => item.status === "warn").length;
  return (
    <AsideCard
      title={live ? t("check.titleLive") : t("check.title")}
      aside={
        <span className={cn("text-xs", blocking ? "text-rose-600" : warnings ? "text-amber-700" : "text-emerald-700")}>
          {blocking ? t("check.blocking", { count: blocking }) : warnings ? t("check.warnings", { count: warnings }) : t("check.ready")}
        </span>
      }
    >
      <ul className="space-y-2.5">
        {items.map((item) => {
          const Icon = item.status === "ok" ? CircleCheck : item.status === "warn" ? AlertTriangle : CircleX;
          return (
            <li key={item.key} className="flex gap-2.5">
              <Icon
                size={16}
                aria-hidden
                className={cn("mt-0.5 shrink-0", item.status === "ok" ? "text-emerald-600" : item.status === "warn" ? "text-amber-600" : "text-rose-600")}
              />
              <span className="min-w-0">
                <span className={cn("block text-sm", item.status === "ok" ? "text-[#52525B]" : "text-[#09090B]")}>{item.label}</span>
                {item.detail && <span className="mt-0.5 block text-xs leading-relaxed text-[#71717A]">{item.detail}</span>}
              </span>
            </li>
          );
        })}
      </ul>
    </AsideCard>
  );
}

/** Kết quả bán của chương trình đã chạy: doanh thu, đơn, món, tiền đã giảm, nhịp bán theo ngày, món bán chạy */
export function SaleResults({ stats, products }: { stats: SaleStats; products: SaleCatalogProduct[] }) {
  const t = useTranslations("AdminPage.saleEvents");
  const locale = useLocale() as Locale;
  const discountShare = stats.revenue + stats.discountGiven > 0 ? Math.round((stats.discountGiven / (stats.revenue + stats.discountGiven)) * 100) : 0;
  return (
    <AsideCard title={t("results.title")}>
      <p className="text-xs text-[#71717A]">{t("results.revenue")}</p>
      <p className="mt-0.5 font-mono text-2xl font-semibold tabular-nums tracking-tight text-[#09090B]">{formatVnd(stats.revenue, locale)}</p>
      <RevenueBars values={stats.dailyRevenue} className="mt-3 h-12" label={t("result.barsLabel")} />
      <p className="mt-1 text-2xs text-[#A1A1AA]">{t("results.barsCaption", { days: stats.dailyRevenue.length })}</p>

      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-dashed border-[#E4E4E7] pt-3 text-sm">
        <div>
          <dt className="text-xs text-[#71717A]">{t("results.orders")}</dt>
          <dd className="mt-0.5 font-mono tabular-nums text-[#09090B]">{stats.orders}</dd>
        </div>
        <div>
          <dt className="text-xs text-[#71717A]">{t("results.units")}</dt>
          <dd className="mt-0.5 font-mono tabular-nums text-[#09090B]">{stats.units}</dd>
        </div>
        <div>
          <dt className="text-xs text-[#71717A]">{t("results.discount")}</dt>
          <dd className="mt-0.5 font-mono tabular-nums text-[#09090B]">{discountShare}%</dd>
        </div>
      </dl>
      <p className="mt-2 text-xs text-[#71717A]">{t("results.discountLine", { amount: formatVnd(stats.discountGiven, locale) })}</p>

      {stats.topProducts.length > 0 && (
        <div className="mt-4 border-t border-dashed border-[#E4E4E7] pt-3">
          <h3 className="mb-2 text-sm font-semibold text-[#09090B]">{t("results.top")}</h3>
          <ol className="space-y-2">
            {stats.topProducts.map((item, index) => {
              const product = products.find((candidate) => candidate.id === item.productId);
              return (
                <li key={item.productId} className="flex items-center gap-2.5 text-sm">
                  <span className="w-4 shrink-0 font-mono text-xs text-[#A1A1AA]">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-[#3F3F46]">{product?.name ?? item.productId}</span>
                  <span className="shrink-0 font-mono text-xs tabular-nums text-[#71717A]">{t("results.unitsShort", { count: item.units })}</span>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </AsideCard>
  );
}

/** Nhật ký chương trình — mới nhất trên cùng */
export function SaleActivityLog({ activity }: { activity: AdminSaleEvent["activity"] }) {
  const t = useTranslations("AdminPage.saleEvents");
  const format = useFormatter();
  return (
    <AsideCard title={t("activity.title")}>
      {activity.length === 0 ? (
        <p className="text-sm text-[#71717A]">{t("activity.empty")}</p>
      ) : (
        <ol className="relative space-y-4 before:absolute before:inset-y-1 before:left-[5px] before:border-l before:border-dashed before:border-[#E4E4E7]">
          {activity.map((item) => (
            <li key={item.id} className="relative pl-6">
              <span aria-hidden className="absolute left-0 top-1.5 size-[11px] rounded-full border-2 border-white bg-[#A1A1AA] ring-1 ring-[#E4E4E7]" />
              <p className="text-sm text-[#09090B]">
                {t(`activity.kind.${item.kind}`)} <span className="text-[#71717A]">· {item.actor}</span>
              </p>
              <p className="text-xs text-[#A1A1AA]">
                {format.dateTime(new Date(item.at), { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: SHOP_TIME_ZONE })}
              </p>
              {item.note && <p className="mt-1 text-xs leading-relaxed text-[#52525B]">{item.note}</p>}
            </li>
          ))}
        </ol>
      )}
    </AsideCard>
  );
}
