import { Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { ActionLink } from "@/components/shared/ActionLink";
import { SectionIntro } from "@/components/shared/SectionIntro";
import { AFTER_SALES_PROCESS_STEPS } from "../constants/afterSalesOptions";
import { AfterSalesPolicy } from "./AfterSalesPolicy";
import { AfterSalesRequestFlow } from "./request/AfterSalesRequestFlow";

/**
 * Trang Sửa đồ & Đổi trả: chính sách (4 dịch vụ + điều kiện) → form gửi yêu cầu (cột trái)
 * cạnh quy trình xử lý + liên hệ nhanh (cột phải, dính khi cuộn).
 */
export function AfterSalesExperience() {
  const t = useTranslations("AfterSalesPage");

  return (
    <div className="grid gap-16 sm:gap-20">
      <AfterSalesPolicy />

      <section id="request" className="scroll-mt-28">
        <SectionIntro eyebrow={t("request.eyebrow")} title={t("request.heading")} description={t("request.intro")} />
        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start xl:gap-12">
          <AfterSalesRequestFlow />

          <aside className="grid gap-6 lg:sticky lg:top-28">
            <div className="bg-(--bg-card) p-6 ring-1 ring-(--border)">
              <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-(--text-main)">{t("process.title")}</h3>
              <ol className="mt-5 grid gap-5">
                {AFTER_SALES_PROCESS_STEPS.map((step, index) => (
                  <li key={step} className="flex gap-4">
                    <span className="font-[family-name:var(--font-playfair)] text-base italic text-(--accent-color)">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-(--text-main)">{t(`process.steps.${step}.title`)}</p>
                      <p className="mt-1 text-xs leading-5 text-(--text-light)">{t(`process.steps.${step}.description`)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-(--bg-secondary) p-6">
              <p className="text-sm leading-6 text-(--text-main)">{t("help.description")}</p>
              <div className="mt-4 grid gap-2">
                <ActionLink href="/contact" variant="dialog" size="md" fullWidth>
                  {t("help.contact")}
                </ActionLink>
                <a
                  href={`tel:${t("help.hotlineValue")}`}
                  className="inline-flex items-center justify-center gap-2 py-2 text-sm text-(--primary-ink) underline-offset-4 hover:underline"
                >
                  <Phone aria-hidden="true" className="size-4" strokeWidth={1.6} />
                  {t("help.hotline")}
                </a>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
