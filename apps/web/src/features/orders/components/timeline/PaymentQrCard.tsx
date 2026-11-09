"use client";

import Image from "next/image";
import { QrCode } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { formatVnd, type Locale } from "@repo/shared";
import { type PaymentInstructionDto } from "@repo/shared/orders";
import { TextField } from "@/components/shared/TextField";

/**
 * Chuyển khoản qua VietQR động: ảnh QR đã điền sẵn số tiền + nội dung "THIENCANH TC-…" — quét bằng app ngân hàng là xong.
 * Bên cạnh là thông tin để chuyển tay (sao chép một chạm).
 */
export function PaymentQrCard({ payment, title }: { payment: PaymentInstructionDto; title?: string }) {
  const t = useTranslations("OrdersPage.payment");
  const locale = useLocale() as Locale;

  return (
    <section className="border border-(--border) bg-(--bg-card) p-5 sm:p-6">
      <div className="flex items-center gap-2">
        <QrCode size={16} strokeWidth={1.6} className="text-(--primary-ink)" aria-hidden="true" />
        <h2 className="m-0 text-[11px] font-semibold uppercase tracking-[2.5px] text-(--primary-ink)">{title ?? t("title")}</h2>
      </div>
      <p className="mt-2 text-[13px] leading-6 text-(--text-light)">{t("description")}</p>

      <div className="mt-5 grid gap-6 md:grid-cols-[220px_minmax(0,1fr)] md:items-start">
        <div className="mx-auto w-full max-w-[240px] border border-(--border) bg-white p-2">
          <Image
            src={payment.qrImageUrl}
            alt={t("qrAlt", { amount: formatVnd(payment.amount, locale) })}
            width={480}
            height={540}
            unoptimized
            className="h-auto w-full"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <TextField readOnly label={t("bank")} value={payment.bankName} />
          <TextField readOnly copyable label={t("accountNumber")} value={payment.accountNumber} />
          <TextField readOnly label={t("accountName")} value={payment.accountName} />
          <TextField readOnly copyable label={t("amount")} value={formatVnd(payment.amount, locale)} />
          <div className="sm:col-span-2">
            <TextField readOnly copyable label={t("content")} value={payment.transferContent} helperText={t("contentHint")} />
          </div>
        </div>
      </div>
    </section>
  );
}
