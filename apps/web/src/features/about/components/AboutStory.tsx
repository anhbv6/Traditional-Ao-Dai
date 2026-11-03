"use client";

import { useTranslations } from "next-intl";
import { containerClassName } from "@/components/layout/Container";
import { Reveal } from "@/components/shared/Reveal";
import { AboutHeading } from "./AboutHeading";

const PARAGRAPH_KEYS = ["origin", "name", "craft"] as const;
const MEANING_KEYS = ["sky", "grain", "watch"] as const;

/**
 * Câu chuyện thương hiệu và ba tầng nghĩa của tên "Thiên Canh": lời kể một bên, từng tầng nghĩa một bên.
 * Chữ "Thiên" / "Canh" đặt to như tiêu đề mục từ để khách đọc ra cách chơi chữ ngay khi lướt qua.
 */
export function AboutStory() {
  const t = useTranslations("AboutPage.story");

  return (
    <section className={containerClassName({ spacing: "section" })}>
      <AboutHeading numeral="I" eyebrow={t("eyebrow")} title={t("title")} />

      <div className="grid gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div className="flex flex-col gap-6">
          {PARAGRAPH_KEYS.map((key, i) => (
            <Reveal key={key} delay={i * 0.12}>
              <p className="max-w-xl text-base leading-8 text-[var(--text-main)]/85">{t(`paragraphs.${key}`)}</p>
            </Reveal>
          ))}
        </div>

        <dl className="flex flex-col">
          {MEANING_KEYS.map((key, i) => (
            <Reveal key={key} delay={i * 0.12}>
              <div className="grid gap-2 border-t border-[var(--text-main)]/20 py-6 first:border-t-0 first:pt-0 sm:grid-cols-[120px_1fr] sm:gap-6">
                <p aria-hidden="true" className="font-[family-name:var(--font-playfair)] text-[2rem] italic leading-tight text-[var(--accent-color)]">
                  {t(`meanings.${key}.word`)}
                </p>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--primary-ink)]">{t(`meanings.${key}.title`)}</dt>
                  <dd className="mt-2 text-[15px] leading-7 text-[var(--text-light)]">{t(`meanings.${key}.text`)}</dd>
                </div>
              </div>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
