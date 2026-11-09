"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { AboutHeading } from "./AboutHeading";
import { containerClassName } from "@/components/layout/Container";

const PAIN_KEYS = ["armhole", "belly", "fit"] as const;
const EASE_CLASS = "ease-[cubic-bezier(0.22,1,0.36,1)]";

/**
 * Ba nỗi lo thường gặp khi mặc áo dài mua sẵn, mỗi nỗi lo đi kèm cách Thiên Canh xử lý.
 * Nội dung luôn hiện sẵn (không giấu sau hover) để đọc một lượt là hiểu; hover chỉ là điểm nhấn:
 * thẻ nhấc lên, vạch đỏ đô chạy dọc mép trên, số thứ tự lớn đậm màu dần.
 */
export function AboutPainSolution() {
  const t = useTranslations("AboutPage.pain");

  return (
    <section className={containerClassName({ spacing: "section" })}>
      <AboutHeading eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <ol className="grid gap-5 md:grid-cols-3 lg:gap-6">
        {PAIN_KEYS.map((key, i) => (
          <li key={key}>
            <Reveal delay={i * 0.12} className="h-full">
              <article
                className={`group relative flex h-full flex-col overflow-hidden border border-(--border) bg-(--bg-card) p-6 transition-[translate,box-shadow] duration-500 ${EASE_CLASS} hover:-translate-y-1.5 hover:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.35)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-8`}
              >
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-(--primary-color) transition-transform duration-700 ${EASE_CLASS} group-hover:scale-x-100`}
                />
                <span
                  aria-hidden="true"
                  className="absolute right-5 top-3 font-[family-name:var(--font-playfair)] text-[4rem] italic leading-none text-(--accent-color)/25 transition-colors duration-700 group-hover:text-(--accent-color)/60 sm:text-[4.5rem]"
                >
                  0{i + 1}
                </span>

                <p className="text-[11px] uppercase tracking-[2.5px] text-(--text-light)">{t("problemLabel")}</p>
                <h3 className="mt-3 max-w-[80%] font-[family-name:var(--font-playfair)] text-xl font-semibold text-(--text-main)">
                  {t(`cards.${key}.title`)}
                </h3>

                <div className="mt-8 border-t border-dashed border-(--border) pt-5">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[2px] text-(--primary-ink)">
                    <span className="grid size-5 place-items-center rounded-full bg-(--primary-color) text-white transition-transform duration-500 group-hover:scale-110">
                      <Check aria-hidden="true" className="size-3" strokeWidth={2.5} />
                    </span>
                    {t("fixLabel")}
                  </p>
                  <p className="mt-3 text-[15px] leading-7 text-(--text-main)/85">{t(`cards.${key}.fix`)}</p>
                </div>
              </article>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
