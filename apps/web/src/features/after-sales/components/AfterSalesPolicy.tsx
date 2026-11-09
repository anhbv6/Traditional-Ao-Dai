import { RefreshCcw, Scissors, ShieldCheck, Undo2, type LucideIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/shared/Reveal";
import { AFTER_SALES_SERVICES, AFTER_SALES_WINDOWS, type AfterSalesService } from "../constants/afterSalesOptions";

const SERVICE_ICONS: Record<AfterSalesService, LucideIcon> = {
  ALTERATION: Scissors,
  EXCHANGE: RefreshCcw,
  RETURN: Undo2,
  WARRANTY: ShieldCheck,
};

/**
 * Bảng chính sách hậu mãi (Server Component): 4 dịch vụ — sửa đồ, đổi, trả, bảo hành —
 * mỗi thẻ ghi hạn áp dụng và loại áo được hỗ trợ; dưới cùng là điều kiện chung.
 */
export function AfterSalesPolicy() {
  const t = useTranslations("AfterSalesPage.policy");
  const conditions = ["tags", "unworn", "receipt", "custom"] as const;

  return (
    <section id="policy" className="scroll-mt-28">
      <div className="grid gap-px bg-(--border) ring-1 ring-(--border) sm:grid-cols-2 xl:grid-cols-4">
        {AFTER_SALES_SERVICES.map((service, index) => {
          const Icon = SERVICE_ICONS[service];
          return (
            <Reveal key={service} delay={index * 0.06} className="flex flex-col bg-(--bg-card) p-6 sm:p-7">
              <Icon aria-hidden="true" className="size-6 text-(--primary-ink)" strokeWidth={1.4} />
              <h2 className="mt-5 font-[family-name:var(--font-playfair)] text-xl font-semibold text-(--text-main)">
                {t(`services.${service}.title`)}
              </h2>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[2px] text-(--primary-ink)">
                {t("window", { days: AFTER_SALES_WINDOWS[service] })}
              </p>
              <p className="mt-3 flex-1 text-sm leading-6 text-(--text-light)">{t(`services.${service}.description`)}</p>
              <p className="mt-5 border-t border-(--border) pt-4 text-xs leading-5 text-(--text-main)">
                {t(`services.${service}.scope`)}
              </p>
            </Reveal>
          );
        })}
      </div>

      <div className="mt-8 grid gap-6 bg-(--bg-secondary) p-6 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-12">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[3px] text-(--primary-ink)">{t("conditionsEyebrow")}</p>
          <h3 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-(--text-main)">
            {t("conditionsTitle")}
          </h3>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {conditions.map((key) => (
            <li key={key} className="border-l-2 border-(--primary-color) pl-4 text-sm leading-6 text-(--text-main)">
              {t(`conditions.${key}`)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
