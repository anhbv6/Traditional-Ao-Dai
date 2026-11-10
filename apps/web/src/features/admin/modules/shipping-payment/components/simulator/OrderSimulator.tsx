"use client";

import { useState } from "react";
import { AlertTriangle, Calculator, Minus, Plus } from "lucide-react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS, AdminFilterSelect, AdminSwitch, AdminTextField } from "@/features/admin/core/ui";
import { type Province, type ShippingPaymentSettings } from "../../types/shippingPayment.types";
import { SHOP_TIME_ZONE, deliveryWindow, paymentOptions, quoteShipping } from "../../utils/shippingRules";
import { formatDigits, parseDigits } from "../shared/SettingsParts";

/**
 * Thử tính một đơn với cấu hình ĐANG SOẠN (chưa lưu): vùng, phí giao (vì sao miễn / còn thiếu bao nhiêu để miễn),
 * ngày giao dự kiến, phương thức khách được chọn và số tiền chuyển trước / thu khi nhận.
 * Vùng rộng: cột phải dính; vùng hẹp: nằm cuối trang, chia hai cột nhập / kết quả.
 */
export function OrderSimulator({ settings, provinces, now, className }: { settings: ShippingPaymentSettings; provinces: Province[]; now: string; className?: string }) {
  const t = useTranslations("AdminPage.shippingPayment");
  const locale = useLocale() as Locale;
  const format = useFormatter();
  const [provinceCode, setProvinceCode] = useState("HN");
  const [subtotal, setSubtotal] = useState<number | null>(1_890_000);
  const [items, setItems] = useState(1);
  const [hasTailored, setHasTailored] = useState(false);
  const [pickup, setPickup] = useState(false);
  const [giftWrap, setGiftWrap] = useState(false);

  const pickupCarrier = settings.carriers.find((carrier) => carrier.kind === "PICKUP" && carrier.isActive);
  const usePickup = pickup && Boolean(pickupCarrier);
  const value = subtotal ?? 0;
  const quote = quoteShipping(settings, { provinceCode, subtotal: value, items, hasTailored, pickup: usePickup });
  const wrapFee = giftWrap && settings.fulfillment.giftWrapEnabled ? settings.fulfillment.giftWrapFee : 0;
  const total = value + quote.fee + wrapFee;
  const options = paymentOptions(settings, { total, hasTailored });
  const deliverable = usePickup || quote.zone !== null;
  const eta = deliveryWindow(now, settings.fulfillment.prepDays, settings.fulfillment.cutoffTime, quote.etaMinDays, quote.etaMaxDays);
  const pause = settings.fulfillment.pause;
  const hitsPause = Boolean(pause?.from && pause?.to && eta.from <= pause.to && eta.to >= pause.from);
  const day = (iso: string) => format.dateTime(new Date(`${iso}T12:00:00+07:00`), { weekday: "short", day: "numeric", month: "numeric", timeZone: SHOP_TIME_ZONE });

  const row = (label: string, amount: string, note?: string, strong?: boolean) => (
    <div className="flex items-start justify-between gap-3">
      <span className={cn("text-sm", strong ? "font-semibold text-[#09090B]" : "text-[#52525B]")}>
        {label}
        {note && <span className="block text-xs font-normal text-[#71717A]">{note}</span>}
      </span>
      <span className={cn("shrink-0 font-mono tabular-nums", strong ? "text-base font-semibold text-[#09090B]" : "text-sm text-[#09090B]")}>{amount}</span>
    </div>
  );

  return (
    <section className={cn(ADMIN_CARD_CLASS, "@container p-4 sm:p-5", className)}>
      <header className="mb-4 flex items-center gap-2">
        <Calculator size={18} className="text-[#71717A]" aria-hidden />
        <div>
          <h2 className="text-lg font-semibold text-[#09090B]">{t("sim.title")}</h2>
          <p className="text-xs text-[#71717A]">{t("sim.description")}</p>
        </div>
      </header>

      <div className="grid gap-5 @xl:grid-cols-2">
        {/* Nhập */}
        <div className="space-y-3">
          <AdminFilterSelect
            label={t("sim.province")}
            value={provinceCode}
            onChange={setProvinceCode}
            options={provinces.map((province) => ({ value: province.code, label: province.name }))}
            className="h-10 w-full"
          />
          <AdminTextField
            label={t("sim.subtotal")}
            mask="currency"
            suffix="₫"
            inputMode="numeric"
            value={formatDigits(subtotal)}
            onValueChange={(next) => setSubtotal(parseDigits(next))}
            inputClassName="font-mono tabular-nums"
          />
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-[#3F3F46]">{t("sim.items")}</span>
            <div className="flex items-center rounded-lg border border-[#E4E4E7]">
              <button type="button" onClick={() => setItems((n) => Math.max(1, n - 1))} aria-label={t("sim.less")} className="grid size-8 cursor-pointer place-items-center text-[#52525B] hover:text-[#09090B]">
                <Minus size={14} />
              </button>
              <span className="w-8 text-center font-mono text-sm tabular-nums">{items}</span>
              <button type="button" onClick={() => setItems((n) => Math.min(20, n + 1))} aria-label={t("sim.more")} className="grid size-8 cursor-pointer place-items-center text-[#52525B] hover:text-[#09090B]">
                <Plus size={14} />
              </button>
            </div>
          </div>
          {(
            [
              ["tailored", hasTailored, setHasTailored, true],
              ["pickup", pickup, setPickup, Boolean(pickupCarrier)],
              ["giftWrap", giftWrap, setGiftWrap, settings.fulfillment.giftWrapEnabled],
            ] as const
          ).map(([key, checked, set, available]) =>
            available ? (
              <div key={key} className="flex items-center justify-between gap-3">
                <span className="text-sm text-[#3F3F46]">{t(`sim.${key}`)}</span>
                <AdminSwitch checked={checked} onChange={set} label={t(`sim.${key}`)} />
              </div>
            ) : null
          )}
        </div>

        {/* Kết quả */}
        <div className="space-y-3 @xl:border-l @xl:border-dashed @xl:border-[#E4E4E7] @xl:pl-5">
          {!deliverable ? (
            <p className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700">
              <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
              {t("sim.noZone", { province: provinces.find((province) => province.code === provinceCode)?.name ?? "" })}
            </p>
          ) : (
            <>
              <p className="text-xs text-[#71717A]">
                {usePickup ? pickupCarrier?.name : t("sim.zoneLine", { zone: quote.zone?.name ?? "", carrier: quote.carrier?.name ?? "—" })}
              </p>
              <div className="space-y-2">
                {row(t("sim.subtotal"), formatVnd(value, locale))}
                {row(
                  t("sim.shipping"),
                  quote.fee === 0 ? (quote.rawFee > 0 ? `0 ₫` : t("sim.free")) : formatVnd(quote.fee, locale),
                  quote.freeReason
                    ? quote.rawFee > 0
                      ? t(`sim.freeReason.${quote.freeReason}`, { amount: formatVnd(quote.rawFee, locale) })
                      : t(`sim.freeReason.${quote.freeReason}`, { amount: "" })
                    : quote.missingForFree
                      ? t("sim.missing", { amount: formatVnd(quote.missingForFree, locale) })
                      : undefined
                )}
                {wrapFee > 0 && row(t("sim.giftWrap"), formatVnd(wrapFee, locale))}
                <div className="border-t border-dashed border-[#E4E4E7] pt-2">{row(t("sim.total"), formatVnd(total, locale), undefined, true)}</div>
              </div>

              <div className="rounded-lg bg-[#FAFAFA] px-3 py-2.5 text-sm">
                <p className="text-xs text-[#71717A]">{hasTailored ? t("sim.etaTailoredLabel") : t("sim.etaLabel")}</p>
                <p className="mt-0.5 text-[#09090B]">
                  {hasTailored
                    ? t("sim.etaTailored", { min: quote.etaMinDays, max: quote.etaMaxDays })
                    : eta.from === eta.to
                      ? day(eta.from)
                      : `${day(eta.from)} – ${day(eta.to)}`}
                </p>
                {hitsPause && !hasTailored && <p className="mt-1 text-xs text-amber-700">{t("sim.pauseHit")}</p>}
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-[#71717A]">{t("sim.methods")}</p>
                <ul className="space-y-1.5">
                  {options.map((option) => (
                    <li key={option.method} className={cn("rounded-lg border px-3 py-2", option.block ? "border-dashed border-[#E4E4E7]" : "border-[#E4E4E7] bg-white")}>
                      <p className={cn("flex items-center justify-between gap-2 text-sm", option.block ? "text-[#A1A1AA]" : "text-[#09090B]")}>
                        <span>{t(`methods.name.${option.method}`)}</span>
                        {!option.block && option.prepay > 0 && <span className="font-mono text-xs tabular-nums">{t("sim.prepay", { amount: formatVnd(option.prepay, locale) })}</span>}
                      </p>
                      <p className="mt-0.5 text-xs text-[#71717A]">
                        {option.block
                          ? t(`sim.block.${option.block}`)
                          : option.onDelivery > 0
                            ? t("sim.onDelivery", { amount: formatVnd(option.onDelivery, locale) })
                            : t("sim.paidUpfront")}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
