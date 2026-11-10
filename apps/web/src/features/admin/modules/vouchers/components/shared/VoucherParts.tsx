"use client";

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { cn } from "@/lib/utils";
import { AdminStatusText, type AdminStatusTone } from "@/features/admin/core/ui";
import { type AdminVoucher, type DiscountType } from "../../types/vouchers.types";
import { SHOP_TIME_ZONE, endReason, voucherState, type VoucherState } from "../../utils/voucherRules";

type OfferRule = { discountType: DiscountType; value: number; minOrderValue: number | null; maxDiscount: number | null };

/** "Giảm 10% · tối đa 200.000 ₫" + dòng điều kiện "Đơn từ 1.000.000 ₫" */
export function useOfferText() {
  const t = useTranslations("AdminPage.vouchers");
  const format = useFormatter();
  const locale = useLocale() as Locale;
  return (rule: OfferRule) => {
    const headline =
      rule.discountType === "PERCENTAGE"
        ? t("offer.percent", { value: format.number(rule.value, { maximumFractionDigits: 1 }) })
        : t("offer.fixed", { amount: formatVnd(rule.value, locale) });
    const cap = rule.discountType === "PERCENTAGE" && rule.maxDiscount ? t("offer.cap", { amount: formatVnd(rule.maxDiscount, locale) }) : null;
    const condition = rule.minOrderValue ? t("offer.min", { amount: formatVnd(rule.minOrderValue, locale) }) : t("offer.anyOrder");
    return { headline, cap, condition };
  };
}

const STATE_TONE: Record<VoucherState, AdminStatusTone> = {
  RUNNING: "success",
  SCHEDULED: "warning",
  ENDED: "neutral",
  DISABLED: "neutral",
};

/** Trạng thái coupon — "hết hạn" và "hết lượt" ghi riêng để biết nên gia hạn hay nâng lượt */
export function VoucherStateText({ voucher, now }: { voucher: AdminVoucher; now: string }) {
  const t = useTranslations("AdminPage.vouchers");
  const state = voucherState(voucher, now);
  const reason = state === "ENDED" ? endReason(voucher, now) : null;
  return <AdminStatusText tone={STATE_TONE[state]}>{reason ? t(`state.${reason}`) : t(`state.${state}`)}</AdminStatusText>;
}

/** Lượt dùng: "12 / 50" + thanh mảnh; không giới hạn thì chỉ số đã dùng */
export function UsageMeter({ used, limit, className }: { used: number; limit: number | null; className?: string }) {
  const t = useTranslations("AdminPage.vouchers");
  return (
    <div className={cn("min-w-0", className)}>
      <p className="font-mono text-sm tabular-nums text-[#09090B]">
        {used}
        <span className="text-[#A1A1AA]"> / {limit ?? "∞"}</span>
      </p>
      {limit !== null ? (
        <span aria-hidden className="mt-1.5 block h-1 w-full max-w-28 overflow-hidden rounded-full bg-[#F4F4F5]">
          <span className="block h-full rounded-full bg-[#3F3F46]" style={{ width: `${Math.min(100, (used / Math.max(limit, 1)) * 100)}%` }} />
        </span>
      ) : (
        <p className="mt-0.5 text-xs text-[#71717A]">{t("unlimited")}</p>
      )}
    </div>
  );
}

/**
 * Phiếu coupon xem trước — như tờ phiếu giấy cắt ở quầy: mã in đậm, câu ưu đãi, điều kiện, hạn dùng;
 * cuống phiếu ngăn bằng đường đục lỗ (khuyết tròn hai bên + nét đứt). Đơn sắc theo quy chuẩn admin.
 */
export function VoucherTicket({
  code,
  rule,
  startDate,
  endDate,
  muted,
}: {
  code: string;
  rule: OfferRule;
  startDate: string | null;
  endDate: string | null;
  muted?: boolean;
}) {
  const t = useTranslations("AdminPage.vouchers");
  const format = useFormatter();
  const offer = useOfferText()(rule);
  const day = (iso: string) => format.dateTime(new Date(iso), { day: "numeric", month: "numeric", year: "numeric", timeZone: SHOP_TIME_ZONE });

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white", muted && "opacity-60")}>
      <div className="px-5 pb-4 pt-5">
        <p className="text-xs font-medium text-[#71717A]">{t("ticket.brand")}</p>
        <p className="mt-2 text-2xl font-semibold leading-tight tracking-tight text-[#09090B]">{offer.headline}</p>
        {offer.cap && <p className="mt-1 text-sm text-[#3F3F46]">{offer.cap}</p>}
        <p className="mt-1 text-sm text-[#71717A]">{offer.condition}</p>
      </div>

      {/* Đường đục lỗ: hai khuyết tròn ở mép + nét đứt */}
      <div aria-hidden className="relative h-5">
        <span className="absolute -left-2.5 top-0 size-5 rounded-full border border-[#E4E4E7] bg-[#FAFAFA]" />
        <span className="absolute -right-2.5 top-0 size-5 rounded-full border border-[#E4E4E7] bg-[#FAFAFA]" />
        <span className="absolute inset-x-4 top-1/2 border-t border-dashed border-[#D4D4D8]" />
      </div>

      <div className="flex items-end justify-between gap-3 px-5 pb-5 pt-3">
        <div className="min-w-0">
          <p className="text-2xs text-[#A1A1AA]">{t("ticket.code")}</p>
          <p className="truncate font-mono text-lg font-semibold tracking-wider text-[#09090B]">{code || "—"}</p>
        </div>
        <p className="shrink-0 text-right text-2xs leading-relaxed text-[#71717A]">
          {startDate && endDate ? (
            <>
              {day(startDate)}
              <br />→ {day(endDate)}
            </>
          ) : (
            t("ticket.noDates")
          )}
        </p>
      </div>
    </div>
  );
}
