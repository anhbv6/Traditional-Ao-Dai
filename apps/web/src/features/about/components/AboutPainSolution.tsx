"use client";

import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/shared/Reveal";
import { AboutHeading } from "./AboutHeading";

const PAIN_KEYS = ["armhole", "belly", "fit"] as const;

/**
 * Nét gạch ngang được "kẻ" qua tên nỗi lo khi cuộn tới — đọc trước rồi mới thấy bị gạch bỏ.
 * Vẽ bằng background-image trên thẻ inline (`box-decoration-clone`) nên tiêu đề xuống dòng vẫn gạch đủ từng dòng.
 */
function StrikeThrough({ children, delay }: { children: string; delay: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.span
      initial={{ backgroundSize: "0% 1px" }}
      whileInView={{ backgroundSize: "100% 1px" }}
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.9, delay, ease: [0.65, 0, 0.35, 1] }}
      className="box-decoration-clone bg-[linear-gradient(var(--accent-color),var(--accent-color))] bg-[position:0_58%] bg-no-repeat"
    >
      {children}
    </motion.span>
  );
}

/** 3 cột ngắn: mỗi cột một nỗi lo (gạch ngang) và cách AODAI xử lý ngay bên dưới */
export function AboutPainSolution() {
  const t = useTranslations("AboutPage.pain");

  return (
    <section className="mx-auto w-full max-w-[1440px] px-5 pb-20 sm:px-8 sm:pb-28 lg:px-10 xl:px-16">
      <AboutHeading numeral="I" eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />

      <div className="grid gap-10 md:grid-cols-3 md:gap-8 lg:gap-12">
        {PAIN_KEYS.map((key, i) => (
          <Reveal key={key} delay={i * 0.12} className="group">
            <p className="text-[11px] uppercase tracking-[2.5px] text-[var(--text-light)]">{t("problemLabel")}</p>
            <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-xl text-[var(--text-light)]">
              <StrikeThrough delay={0.6 + i * 0.15}>{t(`cards.${key}.title`)}</StrikeThrough>
            </h3>
            {/* Vạch đỏ đô chạy dài ra khi rê chuột */}
            <span aria-hidden="true" className="mt-6 block h-px bg-[var(--border)]">
              <span className="block h-px w-10 bg-[var(--primary-color)] transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:w-full" />
            </span>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--primary-color)]">{t("fixLabel")}</p>
            <p className="mt-2 text-[15px] leading-7 text-[var(--text-main)]">{t(`cards.${key}.fix`)}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
