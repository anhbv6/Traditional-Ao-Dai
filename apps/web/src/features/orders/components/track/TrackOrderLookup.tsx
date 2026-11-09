"use client";

import { Search, ShieldCheck } from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { ActionButton } from "@/components/shared/ActionButton";
import { TextField } from "@/components/shared/TextField";
import { extractErrorMessage } from "@/lib/messages";
import { useOrderLookup } from "../../hooks/useOrderLookup";
import { TrackingStepper } from "../timeline/TrackingStepper";

/**
 * Cơ chế A — tra cứu bằng mã đơn + SĐT/email (khách vãng lai, không cần đăng nhập).
 * Kết quả tối giản: trạng thái, stepper 5 bước, tên món — không hiện địa chỉ / số đo (xem đầy đủ qua link trong email).
 * Lỗi hiển thị ngay dưới form (cùng một câu khi sai mã hay sai liên hệ).
 */
export function TrackOrderLookup() {
  const t = useTranslations("OrdersPage");
  const tErrors = useTranslations("Errors");
  const format = useFormatter();
  const { form, submit, result, error, isPending } = useOrderLookup();
  const { errors } = form.formState;
  const errorText = (key?: string) => (key ? tErrors(key) : undefined);
  const lookupError = error ? extractErrorMessage(error) : null;
  const date = (iso: string) => format.dateTime(new Date(iso), { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:gap-12">
      <form onSubmit={submit} noValidate className="h-fit space-y-5 border border-(--border) bg-(--bg-card) p-5 sm:p-6">
        <TextField
          label={t("lookup.orderCode")}
          placeholder={t("lookup.orderCodePlaceholder")}
          helperText={t("lookup.orderCodeHint")}
          autoComplete="off"
          inputClassName="uppercase"
          {...form.register("orderCode")}
          error={errorText(errors.orderCode?.message)}
        />
        <TextField
          label={t("lookup.contact")}
          placeholder={t("lookup.contactPlaceholder")}
          autoComplete="tel"
          {...form.register("contact")}
          error={errorText(errors.contact?.message)}
        />
        {lookupError ? (
          <p role="alert" className="border-l-2 border-(--danger) bg-(--danger)/5 px-4 py-3 text-xs leading-5 text-(--danger)">
            {tErrors.has(lookupError) ? tErrors(lookupError) : tErrors("DEFAULT_ERROR")}
          </p>
        ) : null}
        <ActionButton type="submit" variant="confirm" size="lg" fullWidth icon={<Search />} loading={isPending}>
          {isPending ? t("lookup.submitting") : t("lookup.submit")}
        </ActionButton>
        <p className="flex gap-2 text-xs leading-5 text-(--text-light)">
          <ShieldCheck size={14} strokeWidth={1.6} className="mt-0.5 shrink-0 text-(--primary-ink)" aria-hidden="true" />
          {t("lookup.privacyNote")}
        </p>
      </form>

      <div aria-live="polite">
        {result ? (
          <section className="space-y-6 border border-(--border) bg-(--bg-card) p-5 sm:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3 border-b border-(--border) pb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[2.5px] text-(--text-light)">{t("timeline.orderCode")}</p>
                <p className="mt-1 font-mono text-xl font-semibold tracking-wider text-(--primary-ink)">{result.orderCode}</p>
                <p className="mt-1 text-xs text-(--text-light)">
                  {t("timeline.placedOn", { date: date(result.createdAt) })}
                  {result.dueDate ? ` · ${t("timeline.dueDate", { date: date(result.dueDate) })}` : null}
                </p>
              </div>
              <span className="border border-(--primary-color)/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-[1.5px] text-(--primary-ink)">
                {t(`status.${result.orderStatus}`)}
              </span>
            </div>

            <TrackingStepper progress={result.progress} />

            <ul className="space-y-2 border-t border-(--border) pt-4 text-sm">
              {result.items.map((item, index) => (
                <li key={`${item.productName}-${index}`} className="flex justify-between gap-4">
                  <span>
                    {item.productName}
                    {item.isCustomFit ? <span className="text-(--text-light)"> · {t("lookup.custom")}</span> : null}
                  </span>
                  <span className="tabular-nums text-(--text-light)">× {item.quantity}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs leading-5 text-(--text-light)">{t("lookup.linkHint")}</p>
          </section>
        ) : (
          <div className="flex h-full min-h-48 flex-col items-center justify-center border border-dashed border-(--border) p-8 text-center">
            <p className="font-[family-name:var(--font-playfair)] text-lg text-(--primary-ink)">{t("lookup.emptyTitle")}</p>
            <p className="mt-2 max-w-sm text-sm leading-6 text-(--text-light)">{t("lookup.emptyDescription")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
