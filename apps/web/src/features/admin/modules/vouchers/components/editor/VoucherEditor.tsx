"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { useNotify } from "@/hooks/useNotify";
import { useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  ADMIN_CARD_CLASS,
  ADMIN_PRIMARY_BUTTON_CLASS,
  AdminDatePicker,
  AdminDetailHeader,
  AdminField,
  AdminSegmentedControl,
  AdminSwitch,
  AdminTextArea,
  AdminTextField,
  AdminTooltip,
} from "@/features/admin/core/ui";
import { createVoucherAction, updateVoucherAction } from "../../actions/vouchers.actions";
import { type DiscountType, type VoucherEditorData, type VoucherFormValues } from "../../types/vouchers.types";
import { VOUCHER_CODE_REGEX, computeDiscount, dayToIso, suggestVoucherCode, toShopDay } from "../../utils/voucherRules";
import { UsageMeter, VoucherStateText, VoucherTicket } from "../shared/VoucherParts";

function Card({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
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

/** Ô tiền đọc giá trị số nguyên từ phần "sạch" của mask tiền tệ */
const digitsToNumber = (raw: string): number | null => (raw.replace(/\D/g, "") ? Number(raw.replace(/\D/g, "")) : null);

/**
 * Soạn / sửa coupon. Trái: mã & mô tả, mức giảm, thời gian & giới hạn. Phải: phiếu xem trước cập nhật theo từng ô gõ,
 * ô "thử tính" ra đúng số tiền giảm theo luật (`computeDiscount`) và lượt dùng khi đang sửa.
 */
export function VoucherEditor({ data }: { data: VoucherEditorData }) {
  const t = useTranslations("AdminPage.vouchers");
  const locale = useLocale() as Locale;
  const notify = useNotify();
  const router = useRouter();
  const existing = data.voucher;
  const today = toShopDay(data.now);
  const codeLocked = Boolean(existing && existing.ordersCount > 0);

  const [code, setCode] = useState(existing?.code ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [discountType, setDiscountType] = useState<DiscountType>(existing?.discountType ?? "PERCENTAGE");
  const [valueRaw, setValueRaw] = useState(existing ? String(existing.value) : "");
  const [maxRaw, setMaxRaw] = useState(existing?.maxDiscount ? String(existing.maxDiscount) : "");
  const [minRaw, setMinRaw] = useState(existing?.minOrderValue ? String(existing.minOrderValue) : "");
  const [limitRaw, setLimitRaw] = useState(existing?.usageLimit ? String(existing.usageLimit) : "");
  const [startDay, setStartDay] = useState(existing ? toShopDay(existing.startDate) : today);
  const [endDay, setEndDay] = useState(existing ? toShopDay(existing.endDate) : "");
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);
  const [tryRaw, setTryRaw] = useState("1500000");
  const [showErrors, setShowErrors] = useState(false);

  const value = discountType === "PERCENTAGE" ? Number(valueRaw.replace(",", ".")) || 0 : (digitsToNumber(valueRaw) ?? 0);
  const rule = {
    discountType,
    value,
    minOrderValue: digitsToNumber(minRaw),
    maxDiscount: discountType === "PERCENTAGE" ? digitsToNumber(maxRaw) : null,
  };
  const normalizedCode = code.trim().toUpperCase();

  const errors = {
    code: !VOUCHER_CODE_REGEX.test(normalizedCode) ? t("errors.code") : null,
    value: value <= 0 || (discountType === "PERCENTAGE" && value > 100) ? t(discountType === "PERCENTAGE" ? "errors.percent" : "errors.amount") : null,
    endDay: !endDay ? t("errors.endRequired") : endDay < startDay ? t("errors.endBeforeStart") : null,
  };
  const valid = Object.values(errors).every((error) => error === null);
  const shown = (key: keyof typeof errors) => (showErrors ? (errors[key] ?? undefined) : undefined);

  const save = useMutation({
    mutationFn: (values: VoucherFormValues) =>
      existing ? updateVoucherAction({ voucherId: existing.id, values }) : createVoucherAction(values),
    onSuccess: (res) => {
      if (!res.success) return notify.error(res.error, existing ? "VOUCHER_UPDATE_FAILED" : "VOUCHER_CREATE_FAILED");
      notify.success(existing ? t("toast.saved") : t("toast.created", { code: res.data.code }));
      if (existing) router.refresh();
      else router.replace(`/admin/vouchers/${res.data.id}`);
    },
    onError: () => notify.error(existing ? "VOUCHER_UPDATE_FAILED" : "VOUCHER_CREATE_FAILED"),
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setShowErrors(true);
    if (!valid) return;
    save.mutate({
      code: normalizedCode,
      description: description.trim(),
      discountType,
      value,
      minOrderValue: rule.minOrderValue,
      maxDiscount: rule.maxDiscount,
      usageLimit: digitsToNumber(limitRaw),
      startDay,
      endDay,
      isActive,
    });
  };

  const tryValue = digitsToNumber(tryRaw) ?? 0;
  const discount = computeDiscount(rule, tryValue);
  const belowMin = rule.minOrderValue !== null && tryValue > 0 && tryValue < rule.minOrderValue;

  return (
    <form onSubmit={handleSubmit} className="contents">
      <AdminDetailHeader
        backHref="/admin/vouchers"
        backLabel={t("editor.back")}
        title={existing ? existing.code : t("editor.newTitle")}
        badge={existing ? <VoucherStateText voucher={existing} now={data.now} /> : undefined}
        subtitle={existing ? t("editor.usedSubtitle", { used: existing.usedCount, orders: existing.ordersCount }) : t("editor.newSubtitle")}
        actions={
          <button type="submit" disabled={save.isPending} className={ADMIN_PRIMARY_BUTTON_CLASS}>
            {save.isPending ? t("processing") : existing ? t("editor.save") : t("editor.create")}
          </button>
        }
      />

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <Card title={t("editor.sections.code")}>
            <div className="space-y-4">
              <AdminTextField
                required
                label={t("editor.field.code")}
                hint={codeLocked ? t("editor.hint.codeLocked") : t("editor.hint.code")}
                value={code}
                disabled={codeLocked}
                onValueChange={(next) => setCode(next.toUpperCase().replace(/[^A-Z0-9-]/g, ""))}
                placeholder="THIENCANH-TET"
                error={shown("code")}
                inputClassName="font-mono tracking-wider"
                suffix={
                  !codeLocked && (
                    <AdminTooltip content={t("editor.generate")}>
                      <button
                        type="button"
                        onClick={() => setCode(suggestVoucherCode())}
                        aria-label={t("editor.generate")}
                        className="grid size-7 cursor-pointer place-items-center rounded-md text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B]"
                      >
                        <Sparkles size={14} />
                      </button>
                    </AdminTooltip>
                  )
                }
              />
              <AdminTextArea
                label={t("editor.field.description")}
                hint={t("editor.hint.description")}
                rows={2}
                maxLength={200}
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder={t("editor.placeholder.description")}
              />
            </div>
          </Card>

          <Card title={t("editor.sections.discount")}>
            <div className="space-y-4">
              <AdminField label={t("editor.field.type")}>
                <AdminSegmentedControl
                  value={discountType}
                  onChange={(next) => {
                    setDiscountType(next);
                    setValueRaw("");
                  }}
                  options={[
                    { value: "PERCENTAGE", label: t("editor.type.PERCENTAGE") },
                    { value: "FIXED_AMOUNT", label: t("editor.type.FIXED_AMOUNT") },
                  ]}
                />
              </AdminField>
              <div className="grid gap-4 sm:grid-cols-2">
                {discountType === "PERCENTAGE" ? (
                  <AdminTextField
                    key="percent"
                    required
                    label={t("editor.field.percent")}
                    value={valueRaw}
                    onValueChange={(next) => setValueRaw(next.replace(/[^0-9.,]/g, ""))}
                    inputMode="decimal"
                    suffix="%"
                    placeholder="10"
                    error={shown("value")}
                    inputClassName="font-mono tabular-nums"
                  />
                ) : (
                  <AdminTextField
                    key="amount"
                    required
                    label={t("editor.field.amount")}
                    mask="currency"
                    suffix="₫"
                    value={valueRaw}
                    onValueChange={(next) => setValueRaw(next)}
                    inputMode="numeric"
                    placeholder="100.000"
                    error={shown("value")}
                    inputClassName="font-mono tabular-nums"
                  />
                )}
                {discountType === "PERCENTAGE" && (
                  <AdminTextField
                    label={t("editor.field.maxDiscount")}
                    hint={t("editor.hint.maxDiscount")}
                    mask="currency"
                    suffix="₫"
                    value={maxRaw}
                    onValueChange={(next) => setMaxRaw(next)}
                    inputMode="numeric"
                    placeholder={t("editor.placeholder.noLimit")}
                    inputClassName="font-mono tabular-nums"
                  />
                )}
                <AdminTextField
                  label={t("editor.field.minOrder")}
                  hint={t("editor.hint.minOrder")}
                  mask="currency"
                  suffix="₫"
                  value={minRaw}
                  onValueChange={(next) => setMinRaw(next)}
                  inputMode="numeric"
                  placeholder={t("editor.placeholder.anyOrder")}
                  inputClassName="font-mono tabular-nums"
                />
              </div>
            </div>
          </Card>

          <Card title={t("editor.sections.limits")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <AdminField label={t("editor.field.start")} required>
                <AdminDatePicker value={startDay} onChange={setStartDay} />
              </AdminField>
              <AdminField label={t("editor.field.end")} required error={shown("endDay")}>
                <AdminDatePicker value={endDay} onChange={setEndDay} min={startDay} invalid={Boolean(shown("endDay"))} />
              </AdminField>
              <AdminTextField
                label={t("editor.field.usageLimit")}
                hint={t("editor.hint.usageLimit")}
                value={limitRaw}
                onValueChange={(next) => setLimitRaw(next.replace(/\D/g, ""))}
                inputMode="numeric"
                placeholder={t("editor.placeholder.noLimit")}
                inputClassName="font-mono tabular-nums"
              />
              <AdminField label={t("editor.field.active")} hint={t("editor.hint.active")}>
                <div className="flex h-10 items-center gap-3">
                  <AdminSwitch checked={isActive} onChange={setIsActive} label={t("editor.field.active")} />
                  <span className="text-sm text-[#3F3F46]">{isActive ? t("editor.activeOn") : t("editor.activeOff")}</span>
                </div>
              </AdminField>
            </div>
          </Card>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-28">
          <VoucherTicket
            code={normalizedCode}
            rule={rule}
            startDate={startDay ? dayToIso(startDay, "start") : null}
            endDate={endDay ? dayToIso(endDay, "end") : null}
            muted={!isActive}
          />

          <Card title={t("editor.try.title")}>
            <AdminTextField
              label={t("editor.try.orderValue")}
              mask="currency"
              suffix="₫"
              value={tryRaw}
              onValueChange={(next) => setTryRaw(next)}
              inputMode="numeric"
              inputClassName="font-mono tabular-nums"
            />
            <div className="mt-4 space-y-2 border-t border-dashed border-[#E4E4E7] pt-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-[#71717A]">{t("editor.try.discount")}</span>
                <span className="font-mono font-semibold tabular-nums text-[#09090B]">−{formatVnd(discount, locale)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-[#71717A]">{t("editor.try.pay")}</span>
                <span className="font-mono tabular-nums text-[#09090B]">{formatVnd(Math.max(tryValue - discount, 0), locale)}</span>
              </div>
              {belowMin && <p className="text-xs text-amber-700">{t("editor.try.belowMin")}</p>}
              {!belowMin && rule.maxDiscount !== null && discount === rule.maxDiscount && discount > 0 && (
                <p className="text-xs text-[#71717A]">{t("editor.try.capped")}</p>
              )}
            </div>
          </Card>

          {existing && (
            <Card title={t("editor.usage")}>
              <UsageMeter used={existing.usedCount} limit={existing.usageLimit} />
              <p className="mt-3 text-xs text-[#71717A]">{t("editor.ordersUsed", { count: existing.ordersCount })}</p>
            </Card>
          )}
          <p className="text-xs leading-relaxed text-[#A1A1AA]">{t("editor.checkoutNote")}</p>
        </aside>
      </div>
    </form>
  );
}
