"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { Reveal } from "@/components/shared/Reveal";
import { AboutHeading } from "./AboutHeading";
import { containerClassName } from "@/components/layout/Container";

const PAIN_KEYS = ["armhole", "belly", "fit"] as const;

/**
 * Ba vấn đề và giải pháp may đo (Minimalism Style):
 * - Thẻ thiết kế dạng Swiss Grid chuẩn xác: Viền hairline sắc nét, không đổ bóng mờ nhạt (shadow-none).
 * - Số thứ tự kiến trúc (01, 02, 03) rõ ràng, chỉn chu.
 * - Phân định rõ ràng giữa "Nỗi băn khoăn" và "Giải pháp khắc phục", toàn bộ văn bản đạt chuẩn WCAG AAA.
 */
export function AboutPainSolution() {
  const t = useTranslations("AboutPage.pain");

  return (
    <section className={containerClassName({ spacing: "section" })}>
      <AboutHeading eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <ol className="grid gap-6 md:grid-cols-3">
        {PAIN_KEYS.map((key, i) => (
          <li key={key}>
            <Reveal delay={i * 0.1} className="h-full">
              <article className="group relative flex h-full flex-col justify-between border border-(--border) bg-(--bg-card) p-7 transition-colors duration-300 hover:border-(--primary-ink)/40 sm:p-8">
                <div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-(--text-light)">
                      {t("problemLabel")}
                    </p>
                    <span className="font-mono text-xs font-semibold tracking-widest text-(--primary-ink)">
                      0{i + 1}
                    </span>
                  </div>

                  <h3 className="mt-4 font-[family-name:var(--font-playfair)] text-xl font-semibold leading-snug text-(--text-main)">
                    {t(`cards.${key}.title`)}
                  </h3>
                </div>

                <div className="mt-8 border-t border-(--border) pt-6">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="grid size-4 place-items-center rounded-full bg-(--primary-color) text-white"
                    >
                      <Check className="size-2.5" strokeWidth={3} />
                    </span>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-(--primary-ink)">
                      {t("fixLabel")}
                    </p>
                  </div>
                  <p className="mt-3.5 text-[15px] leading-relaxed text-(--text-main)">
                    {t(`cards.${key}.fix`)}
                  </p>
                </div>
              </article>
            </Reveal>
          </li>
        ))}
      </ol>
    </section>
  );
}
