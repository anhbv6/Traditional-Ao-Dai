"use client";

import { Footprints, Gem, Layers, Ruler, Shirt, type LucideIcon } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { type ProductGroup } from "@repo/shared/sizing";
import { cn } from "@/lib/utils";
import { AdminStatusText, type AdminStatusTone } from "@/features/admin/core/ui";
import { type AdminSaleEvent, type SaleCatalogProduct, type SaleDiscountType } from "../../types/saleEvents.types";
import { SHOP_TIME_ZONE, saleState, type SaleState } from "../../utils/saleRules";

/** "Giảm 15%" / "Giảm 200.000 ₫" / "Đồng giá 199.000 ₫" */
export function useSaleOfferText() {
  const t = useTranslations("AdminPage.saleEvents");
  const format = useFormatter();
  const locale = useLocale() as Locale;
  return (rule: { discountType: SaleDiscountType; value: number }) => {
    if (rule.discountType === "PERCENTAGE") return t("offer.percent", { value: format.number(rule.value, { maximumFractionDigits: 1 }) });
    if (rule.discountType === "FIXED_AMOUNT") return t("offer.amount", { amount: formatVnd(rule.value, locale) });
    return t("offer.fixedPrice", { amount: formatVnd(rule.value, locale) });
  };
}

/** Ngày + giờ ngắn theo giờ tiệm: "20/11 08:00" (giờ 00:00 thì bỏ) */
export function useSaleDateText() {
  const format = useFormatter();
  return (iso: string, withYear = false) => {
    const date = new Date(iso);
    const day = format.dateTime(date, { day: "2-digit", month: "2-digit", ...(withYear ? { year: "numeric" } : {}), timeZone: SHOP_TIME_ZONE });
    const time = format.dateTime(date, { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: SHOP_TIME_ZONE });
    return time === "00:00" ? day : `${day} ${time}`;
  };
}

const STATE_TONE: Record<SaleState, AdminStatusTone> = {
  RUNNING: "success",
  SCHEDULED: "warning",
  PAUSED: "danger",
  DRAFT: "neutral",
  ENDED: "neutral",
};

export function SaleStateText({ event, now }: { event: AdminSaleEvent; now: string }) {
  const t = useTranslations("AdminPage.saleEvents");
  const state = saleState(event, now);
  return <AdminStatusText tone={STATE_TONE[state]}>{event.endedEarlyAt && state === "ENDED" ? t("state.ENDED_EARLY") : t(`state.${state}`)}</AdminStatusText>;
}

const GROUP_ICONS: Record<ProductGroup, LucideIcon> = {
  AO_DAI: Shirt,
  PANTS: Layers,
  ACCESSORY: Gem,
  FOOTWEAR: Footprints,
  MATERIAL: Ruler,
};

/** Ô ảnh 3:4 thay ảnh sản phẩm ở bản mock — icon nhóm hàng trên nền xám */
export function ProductThumb({ product, className }: { product: Pick<SaleCatalogProduct, "group" | "name">; className?: string }) {
  const Icon = GROUP_ICONS[product.group];
  return (
    <span aria-hidden className={cn("grid aspect-[3/4] w-12 shrink-0 place-items-center rounded-lg bg-[#F4F4F5] text-[#A1A1AA]", className)}>
      <Icon size={18} strokeWidth={1.5} />
    </span>
  );
}

/** Nhãn huy hiệu chương trình (đúng chữ hiện trên ảnh sản phẩm ở storefront) */
export function SaleBadge({ children, muted }: { children: string; muted?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-md border px-1.5 py-0.5 text-2xs font-medium",
        muted ? "border-[#E4E4E7] text-[#A1A1AA]" : "border-[#18181B] text-[#18181B]"
      )}
    >
      {children}
    </span>
  );
}

/**
 * Dải cột doanh thu theo ngày — nhỏ, không trục, chỉ để thấy nhịp bán (ngày cuối tô đậm).
 * Cột 0 vẫn có vạch 2px để không tưởng là thiếu dữ liệu.
 */
export function RevenueBars({ values, className, label }: { values: number[]; className?: string; label: string }) {
  const max = Math.max(...values, 1);
  return (
    <div role="img" aria-label={label} className={cn("flex h-10 items-end gap-[3px]", className)}>
      {values.map((value, index) => (
        <span
          key={index}
          className={cn("min-w-[3px] flex-1 rounded-sm", index === values.length - 1 ? "bg-[#18181B]" : "bg-[#D4D4D8]")}
          style={{ height: `${Math.max(5, (value / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

/** Suất sale: "7 / 10" + thanh mảnh; gần hết thì thanh đổi màu cảnh báo */
export function QuotaMeter({ sold, quota, className }: { sold: number; quota: number | null; className?: string }) {
  const t = useTranslations("AdminPage.saleEvents");
  if (quota === null) return <span className={cn("text-xs text-[#71717A]", className)}>{t("quota.unlimited", { sold })}</span>;
  const ratio = Math.min(1, sold / Math.max(quota, 1));
  return (
    <div className={cn("min-w-0", className)}>
      <p className="font-mono text-sm tabular-nums text-[#09090B]">
        {sold}
        <span className="text-[#A1A1AA]"> / {quota}</span>
      </p>
      <span aria-hidden className="mt-1 block h-1 w-full max-w-24 overflow-hidden rounded-full bg-[#F4F4F5]">
        <span className={cn("block h-full rounded-full", ratio >= 0.8 ? "bg-amber-500" : "bg-[#3F3F46]")} style={{ width: `${ratio * 100}%` }} />
      </span>
    </div>
  );
}
