"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";
import { useTranslations } from "next-intl";
import { containerClassName } from "@/components/layout/Container";
import { Reveal } from "@/components/shared/Reveal";
import { AboutHeading } from "./AboutHeading";
import { ClipReveal } from "./ClipReveal";

const PARAGRAPH_KEYS = ["origin", "craft"] as const;
/** Chữ "Canh" mang hai tầng nghĩa — gom chung một cột để tên đọc đúng là "Thiên Canh" (hai chữ) */
const CANH_KEYS = ["grain", "watch"] as const;
const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Câu chuyện thương hiệu (Minimalism Style):
 * - Bỏ mọi chi tiết viền lệch trang trí giả tạp chí, ảnh thủ công chuẩn mực với viền hairline tinh gọn.
 * - Chữ hiển thị "Thiên" & "Canh" chuyển sang tone thương hiệu chuẩn độ tương phản cao (> 11:1).
 * - Cấu trúc phân giải ngữ nghĩa tên tiệm theo phong cách Swiss Grid cân xứng.
 */
export function AboutStory() {
  const t = useTranslations("AboutPage.story");

  return (
    <section className={containerClassName({ spacing: "section" })}>
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
        <figure className="relative mx-auto w-full max-w-[520px] lg:mx-0">
          <ClipReveal className="aspect-[4/3] border border-(--border) bg-(--bg-secondary) sm:aspect-[4/5]">
            <Image
              src="/images/ex5.jpg"
              alt={t("imageAlt")}
              fill
              sizes="(max-width: 1024px) 90vw, 520px"
              className="object-cover"
            />
          </ClipReveal>
          <figcaption className="mt-3 text-xs tracking-wide text-(--text-main)/85">
            {t("imageCaption")}
          </figcaption>
        </figure>

        <div>
          <AboutHeading eyebrow={t("eyebrow")} title={t("title")} className="mb-8 sm:mb-10" />
          <div className="flex max-w-xl flex-col gap-5 border-l border-(--border) pl-6">
            {PARAGRAPH_KEYS.map((key, i) => (
              <Reveal key={key} delay={0.1 + i * 0.12}>
                <p className="text-base leading-relaxed text-(--text-main)">
                  {t(`paragraphs.${key}`)}
                </p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-20 sm:mt-28">
        <Reveal>
          <div className="flex items-center justify-center gap-3">
            <span aria-hidden="true" className="h-px w-8 bg-(--primary-ink)/30" />
            <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-(--primary-ink)">
              {t("nameLabel")}
            </p>
            <span aria-hidden="true" className="h-px w-8 bg-(--primary-ink)/30" />
          </div>
        </Reveal>

        <dl className="mt-10 grid border-y border-(--border) md:grid-cols-[1fr_1.35fr]">
          {/* Cột chữ THIÊN */}
          <div className="py-10 md:py-14 md:pr-14">
            <BigWord word={t("meanings.sky.word")} />
            <dt className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-(--primary-ink)">
              {t("meanings.sky.title")}
            </dt>
            <dd className="mt-3 max-w-md text-[15px] leading-relaxed text-(--text-main)">
              {t("meanings.sky.text")}
            </dd>
          </div>

          {/* Cột chữ CANH */}
          <div className="border-t border-(--border) py-10 md:border-l md:border-t-0 md:py-14 md:pl-14">
            <BigWord word={t("meanings.grain.word")} delay={0.18} />
            <p className="mt-6 text-xs font-medium uppercase tracking-[0.2em] text-(--text-light)">
              {t("canhLabel")}
            </p>
            <div className="mt-5 grid gap-8 sm:grid-cols-2">
              {CANH_KEYS.map((key, i) => (
                <Reveal key={key} delay={0.25 + i * 0.1} className="border-l border-(--primary-ink)/35 pl-4">
                  <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-(--primary-ink)">
                    {t(`meanings.${key}.title`)}
                  </dt>
                  <dd className="mt-2 text-[15px] leading-relaxed text-(--text-main)">
                    {t(`meanings.${key}.text`)}
                  </dd>
                </Reveal>
              ))}
            </div>
          </div>
        </dl>
      </div>
    </section>
  );
}

/** Chữ lớn trồi lên từng ký tự theo nhịp cuộn, tone đỏ đô tương phản cao >= 11:1 */
function BigWord({ word, delay = 0 }: { word: string; delay?: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.p
      aria-label={word}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -12% 0px" }}
      className="flex overflow-hidden pb-1 font-[family-name:var(--font-playfair)] text-[3.75rem] font-semibold italic leading-none text-(--heading-color) sm:text-[4.75rem]"
    >
      {Array.from(word).map((char, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          variants={{ hidden: { y: "110%" }, visible: { y: 0 } }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.8, delay: delay + i * 0.05, ease: EASE }}
          className="inline-block"
        >
          {char}
        </motion.span>
      ))}
    </motion.p>
  );
}
