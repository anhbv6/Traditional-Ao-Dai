"use client";

import { ArrowDown, ArrowUp, Banknote, Copy, Landmark, Lock, PiggyBank, QrCode, Wallet } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { DEPOSIT_PERCENT_MAX, DEPOSIT_PERCENT_MIN, buildTransferContent, type PaymentMethod } from "@repo/shared/orders";
import { useNotify } from "@/hooks/useNotify";
import { cn } from "@/lib/utils";
import {
  ADMIN_ROW_ICON_BUTTON_CLASS,
  AdminField,
  AdminFilterSelect,
  AdminSegmentedControl,
  AdminSwitch,
  AdminTextField,
  AdminTooltip,
} from "@/features/admin/core/ui";
import { type ShippingPaymentData, type ShippingPaymentSettings } from "../../types/shippingPayment.types";
import { normalizeAccountName } from "../../utils/shippingRules";
import { SettingsCard, SwitchRow, formatDigits, parseDigits } from "../shared/SettingsParts";

type Update = (change: (settings: ShippingPaymentSettings) => ShippingPaymentSettings) => void;

const METHOD_ICON: Record<PaymentMethod, typeof Banknote> = { COD: Banknote, BANK_TRANSFER: QrCode, DEPOSIT: PiggyBank };
/** Mã đơn mẫu cho phần xem trước nội dung chuyển khoản */
const SAMPLE_ORDER_CODE = "TC-2611-7KQM";
const SAMPLE_AMOUNT = 1_890_000;

/**
 * Tab Thanh toán: phương thức (bật / tắt, thứ tự hiện ở trang thanh toán, quy tắc riêng của từng phương thức ngay dưới nó),
 * tài khoản nhận chuyển khoản kèm xem trước đúng thông tin khách thấy, hạn thanh toán.
 */
export function PaymentTab({ data, settings, update }: { data: ShippingPaymentData; settings: ShippingPaymentSettings; update: Update }) {
  const t = useTranslations("AdminPage.shippingPayment");
  const locale = useLocale() as Locale;
  const notify = useNotify();
  const { cod, deposit, bank, deadline } = settings;

  const setMethod = (method: PaymentMethod, change: Partial<ShippingPaymentSettings["methods"][number]>) =>
    update((s) => ({ ...s, methods: s.methods.map((item) => (item.method === method ? { ...item, ...change } : item)) }));
  const move = (index: number, delta: number) =>
    update((s) => {
      const methods = [...s.methods];
      const [item] = methods.splice(index, 1);
      methods.splice(index + delta, 0, item!);
      return { ...s, methods };
    });
  const setCod = (change: Partial<typeof cod>) => update((s) => ({ ...s, cod: { ...s.cod, ...change } }));
  const setDeposit = (change: Partial<typeof deposit>) => update((s) => ({ ...s, deposit: { ...s.deposit, ...change } }));
  const setBank = (change: Partial<typeof bank>) => update((s) => ({ ...s, bank: { ...s.bank, ...change } }));
  const setDeadline = (change: Partial<typeof deadline>) => update((s) => ({ ...s, deadline: { ...s.deadline, ...change } }));

  const depositInvalid = deposit.percent < DEPOSIT_PERCENT_MIN || deposit.percent > DEPOSIT_PERCENT_MAX;
  const usesBank = settings.methods.some((item) => item.enabled && item.method !== "COD");

  /** Quy tắc riêng hiện ngay dưới phương thức khi bật */
  const methodRules = (method: PaymentMethod) => {
    if (method === "COD")
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <AdminTextField
              label={t("methods.cod.max")}
              hint={t("methods.cod.maxHint")}
              mask="currency"
              suffix="₫"
              inputMode="numeric"
              value={formatDigits(cod.maxOrderValue)}
              onValueChange={(next) => setCod({ maxOrderValue: parseDigits(next) })}
              placeholder={t("noLimit")}
              inputClassName="font-mono tabular-nums"
            />
            <AdminField label={t("methods.cod.verified")} hint={t("methods.cod.verifiedHint")}>
              <div className="flex h-10 items-center gap-3">
                <AdminSwitch checked={cod.verifiedPhoneOnly} onChange={(verifiedPhoneOnly) => setCod({ verifiedPhoneOnly })} label={t("methods.cod.verified")} />
                <span className="text-sm text-[#52525B]">{cod.verifiedPhoneOnly ? t("on") : t("off")}</span>
              </div>
            </AdminField>
          </div>
          <p className="flex items-center gap-1.5 text-xs text-[#71717A]">
            <Lock size={12} aria-hidden /> {t("methods.cod.tailoredLocked")}
          </p>
        </div>
      );
    if (method === "DEPOSIT")
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <AdminField
            label={t("methods.deposit.percent")}
            hint={t("methods.deposit.percentHint", { min: DEPOSIT_PERCENT_MIN, max: DEPOSIT_PERCENT_MAX })}
            error={depositInvalid ? t("methods.deposit.percentError", { min: DEPOSIT_PERCENT_MIN, max: DEPOSIT_PERCENT_MAX }) : undefined}
          >
            <div className="flex items-center gap-2">
              <AdminSegmentedControl
                value={String(deposit.percent)}
                onChange={(value) => setDeposit({ percent: Number(value) })}
                options={["30", "40", "50"].map((value) => ({ value, label: `${value}%` }))}
              />
              <div className="w-20">
                <AdminTextField
                  aria-label={t("methods.deposit.percent")}
                  value={String(deposit.percent)}
                  onValueChange={(next) => setDeposit({ percent: Number(next.replace(/\D/g, "").slice(0, 3) || 0) })}
                  inputMode="numeric"
                  suffix="%"
                  aria-invalid={depositInvalid || undefined}
                  inputClassName="font-mono tabular-nums"
                />
              </div>
            </div>
          </AdminField>
          <AdminTextField
            label={t("methods.deposit.requiredAbove")}
            hint={t("methods.deposit.requiredAboveHint")}
            mask="currency"
            suffix="₫"
            inputMode="numeric"
            value={formatDigits(deposit.requiredAbove)}
            onValueChange={(next) => setDeposit({ requiredAbove: parseDigits(next) })}
            placeholder={t("methods.deposit.never")}
            inputClassName="font-mono tabular-nums"
          />
        </div>
      );
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        <AdminTextField
          label={t("methods.transfer.remind")}
          hint={t("methods.transfer.remindHint")}
          value={String(deadline.remindAfterHours)}
          onValueChange={(next) => setDeadline({ remindAfterHours: Number(next.replace(/\D/g, "").slice(0, 3) || 0) })}
          inputMode="numeric"
          suffix={<span className="text-xs text-[#A1A1AA]">{t("hours")}</span>}
          inputClassName="font-mono tabular-nums"
        />
        <AdminTextField
          label={t("methods.transfer.autoCancel")}
          hint={t("methods.transfer.autoCancelHint")}
          value={deadline.autoCancelAfterHours === null ? "" : String(deadline.autoCancelAfterHours)}
          onValueChange={(next) => setDeadline({ autoCancelAfterHours: next.replace(/\D/g, "") ? Number(next.replace(/\D/g, "").slice(0, 3)) : null })}
          inputMode="numeric"
          placeholder={t("methods.transfer.never")}
          suffix={<span className="text-xs text-[#A1A1AA]">{t("hours")}</span>}
          inputClassName="font-mono tabular-nums"
        />
      </div>
    );
  };

  const transferContent = buildTransferContent(SAMPLE_ORDER_CODE);
  const copy = (value: string) => {
    void navigator.clipboard?.writeText(value).then(
      () => notify.success(t("bank.copied")),
      () => undefined
    );
  };

  return (
    <div className="space-y-5">
      <SettingsCard id="methods" title={t("methods.title")} description={t("methods.description")}>
        <ol className="-mx-1 divide-y divide-dashed divide-[#E4E4E7]">
          {settings.methods.map((item, index) => {
            const Icon = METHOD_ICON[item.method];
            return (
              <li key={item.method} className="px-1 py-4 first:pt-1">
                <div className="flex items-start gap-3">
                  <span className={cn("grid size-9 shrink-0 place-items-center rounded-full border", item.enabled ? "border-[#18181B] text-[#18181B]" : "border-dashed border-[#D4D4D8] text-[#A1A1AA]")}>
                    <Icon size={16} aria-hidden />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={cn("text-body font-medium", item.enabled ? "text-[#09090B]" : "text-[#A1A1AA]")}>
                      <span className="mr-2 font-mono text-xs text-[#A1A1AA]">{index + 1}</span>
                      {t(`methods.name.${item.method}`)}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-[#71717A]">
                      {item.method === "DEPOSIT"
                        ? t("methods.summary.DEPOSIT", { percent: deposit.percent })
                        : item.method === "COD"
                          ? cod.maxOrderValue
                            ? t("methods.summary.CODLimited", { amount: formatVnd(cod.maxOrderValue, locale) })
                            : t("methods.summary.COD")
                          : t("methods.summary.BANK_TRANSFER")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-0.5">
                    <AdminTooltip content={t("methods.up")}>
                      <button type="button" disabled={index === 0} onClick={() => move(index, -1)} aria-label={t("methods.up")} className={cn(ADMIN_ROW_ICON_BUTTON_CLASS, "size-8")}>
                        <ArrowUp size={15} />
                      </button>
                    </AdminTooltip>
                    <AdminTooltip content={t("methods.down")}>
                      <button
                        type="button"
                        disabled={index === settings.methods.length - 1}
                        onClick={() => move(index, 1)}
                        aria-label={t("methods.down")}
                        className={cn(ADMIN_ROW_ICON_BUTTON_CLASS, "mr-2 size-8")}
                      >
                        <ArrowDown size={15} />
                      </button>
                    </AdminTooltip>
                    <AdminSwitch checked={item.enabled} onChange={(enabled) => setMethod(item.method, { enabled })} label={t(`methods.name.${item.method}`)} />
                  </div>
                </div>
                {item.enabled && (
                  <div className="mt-3 space-y-3 sm:pl-12">
                    <AdminTextField
                      label={t("methods.customerNote")}
                      hint={t("methods.customerNoteHint")}
                      value={item.customerNote}
                      onValueChange={(customerNote) => setMethod(item.method, { customerNote })}
                      maxLength={120}
                      placeholder={t("methods.customerNotePlaceholder")}
                    />
                    {methodRules(item.method)}
                  </div>
                )}
              </li>
            );
          })}
          {/* Cổng thanh toán: chưa tích hợp — hiện để biết hướng mở rộng, không bật được */}
          <li className="flex items-start gap-3 px-1 py-4 opacity-60">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-dashed border-[#D4D4D8] text-[#A1A1AA]">
              <Wallet size={16} aria-hidden />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-body font-medium text-[#71717A]">{t("methods.gateway")}</p>
              <p className="mt-0.5 text-xs text-[#71717A]">{t("methods.gatewayHint")}</p>
            </div>
            <span className="shrink-0 rounded-md border border-[#E4E4E7] px-2 py-0.5 text-2xs text-[#71717A]">{t("methods.notConnected")}</span>
          </li>
        </ol>
      </SettingsCard>

      <SettingsCard
        id="bank"
        title={t("bank.title")}
        description={usesBank ? t("bank.description") : t("bank.unused")}
        aside={<Landmark size={18} className="text-[#A1A1AA]" aria-hidden />}
      >
        <div className="grid items-start gap-5 @3xl:grid-cols-[minmax(0,1fr)_300px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <AdminField label={t("bank.bank")} required className="sm:col-span-2">
              <AdminFilterSelect
                label={t("bank.bankShort")}
                value={bank.bankBin}
                placeholder={t("bank.bankPlaceholder")}
                onChange={(bankBin) => setBank({ bankBin, bankName: data.banks.find((item) => item.bin === bankBin)?.name ?? bank.bankName })}
                options={data.banks.map((item) => ({ value: item.bin, label: `${item.name} · ${item.bin}` }))}
                className="h-10 w-full"
              />
            </AdminField>
            <AdminTextField
              required
              label={t("bank.accountNumber")}
              value={bank.accountNumber}
              onValueChange={(next) => setBank({ accountNumber: next.replace(/\D/g, "").slice(0, 19) })}
              inputMode="numeric"
              placeholder={t("bank.accountNumberPlaceholder")}
              error={bank.accountNumber ? (!/^\d{6,19}$/.test(bank.accountNumber) ? t("bank.accountNumberError") : undefined) : undefined}
              inputClassName="font-mono tabular-nums tracking-wide"
            />
            <AdminTextField
              label={t("bank.branch")}
              value={bank.branch}
              onValueChange={(branch) => setBank({ branch })}
              placeholder={t("bank.branchPlaceholder")}
              maxLength={60}
            />
            <AdminTextField
              required
              className="sm:col-span-2"
              label={t("bank.accountName")}
              hint={t("bank.accountNameHint")}
              placeholder={t("bank.accountNamePlaceholder")}
              value={bank.accountName}
              onValueChange={(next) => setBank({ accountName: normalizeAccountName(next).slice(0, 50) })}
              inputClassName="font-mono tracking-wide"
            />
          </div>

          {/* Xem trước khung chuyển khoản ở trang cảm ơn / chi tiết đơn của khách */}
          <div className="rounded-2xl border border-[#E4E4E7] bg-[#FAFAFA] p-4">
            <p className="text-xs font-medium text-[#71717A]">{t("bank.preview")}</p>
            {bank.accountNumber || bank.bankName ? (
              <>
                <div className="mt-3 flex gap-3">
                  <span className="grid size-20 shrink-0 place-items-center rounded-lg border border-[#E4E4E7] bg-white text-[#18181B]">
                    <QrCode size={52} strokeWidth={1.25} aria-hidden />
                  </span>
                  <dl className="min-w-0 space-y-1.5 text-xs">
                    <div>
                      <dt className="text-[#A1A1AA]">{bank.bankName || "—"}</dt>
                      <dd className="truncate font-mono text-sm font-semibold tabular-nums text-[#09090B]">{bank.accountNumber || "—"}</dd>
                    </div>
                    <div>
                      <dt className="sr-only">{t("bank.accountName")}</dt>
                      <dd className="truncate font-mono text-[#3F3F46]">{bank.accountName || "—"}</dd>
                    </div>
                  </dl>
                </div>
                <dl className="mt-3 space-y-2 border-t border-dashed border-[#E4E4E7] pt-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-[#71717A]">{t("bank.amount")}</dt>
                    <dd className="font-mono font-semibold tabular-nums text-[#09090B]">{formatVnd(SAMPLE_AMOUNT, locale)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <dt className="text-[#71717A]">{t("bank.content")}</dt>
                    <dd className="flex items-center gap-1">
                      <span className="font-mono font-semibold text-[#09090B]">{transferContent}</span>
                      <AdminTooltip content={t("bank.copy")}>
                        <button type="button" onClick={() => copy(transferContent)} aria-label={t("bank.copy")} className={cn(ADMIN_ROW_ICON_BUTTON_CLASS, "size-7")}>
                          <Copy size={13} />
                        </button>
                      </AdminTooltip>
                    </dd>
                  </div>
                </dl>
                <p className="mt-3 text-2xs leading-relaxed text-[#A1A1AA]">{t("bank.previewNote")}</p>
              </>
            ) : (
              <div className="mt-3 flex flex-col items-center justify-center rounded-xl border border-dashed border-[#D4D4D8] bg-white py-8 text-center">
                <QrCode size={36} strokeWidth={1.25} className="text-[#A1A1AA]" aria-hidden />
                <p className="mt-2 text-xs font-medium text-[#71717A]">{t("bank.emptyPreview")}</p>
                <p className="mt-1 text-2xs text-[#A1A1AA]">{t("bank.emptyPreviewHint")}</p>
              </div>
            )}
          </div>
        </div>
      </SettingsCard>

      <SettingsCard id="reconcile" title={t("reconcile.title")} description={t("reconcile.description")}>
        <SwitchRow className="pt-0" label={t("reconcile.webhook")} hint={t("reconcile.webhookHint")} checked={false} onChange={() => undefined} disabled />
      </SettingsCard>
    </div>
  );
}
