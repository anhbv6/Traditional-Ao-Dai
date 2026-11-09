"use client";

import { CheckCircle2, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { ActionButton } from "@/components/shared/ActionButton";
import { ActionLink } from "@/components/shared/ActionLink";
import { type AfterSalesService } from "../../constants/afterSalesOptions";

interface AfterSalesSuccessProps {
  requestCode: string;
  orderCode: string;
  productName: string;
  service: AfterSalesService;
  onStartOver: () => void;
}

/** Màn xác nhận sau khi gửi yêu cầu: mã yêu cầu, tóm tắt và việc tiếp theo */
export function AfterSalesSuccess({ requestCode, orderCode, productName, service, onStartOver }: AfterSalesSuccessProps) {
  const t = useTranslations("AfterSalesPage.success");
  const tServices = useTranslations("AfterSalesPage.policy.services");

  return (
    <section role="status" className="bg-(--bg-card) p-6 text-center ring-1 ring-(--border) sm:p-12">
      <CheckCircle2 aria-hidden="true" className="mx-auto size-10 text-(--primary-ink)" strokeWidth={1.3} />
      <h2 className="mt-5 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-(--text-main) sm:text-3xl">
        {t("title")}
      </h2>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-(--text-light)">{t("description")}</p>

      <dl className="mx-auto mt-8 grid max-w-xl gap-px bg-(--border) text-left ring-1 ring-(--border) sm:grid-cols-2">
        {[
          { label: t("requestCode"), value: requestCode, mono: true },
          { label: t("orderCode"), value: orderCode, mono: true },
          { label: t("item"), value: productName },
          { label: t("service"), value: tServices(`${service}.title`) },
        ].map((row) => (
          <div key={row.label} className="bg-(--bg-card) px-4 py-3">
            <dt className="text-[11px] uppercase tracking-[2px] text-(--text-light)">{row.label}</dt>
            <dd className={row.mono ? "mt-1 font-mono text-sm tracking-wider text-(--primary-ink)" : "mt-1 text-sm text-(--text-main)"}>
              {row.value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <ActionButton variant="dialog" size="lg" icon={<Plus />} onClick={onStartOver}>
          {t("another")}
        </ActionButton>
        <ActionLink href="/products" variant="confirm" size="lg">
          {t("continueShopping")}
        </ActionLink>
      </div>
    </section>
  );
}
