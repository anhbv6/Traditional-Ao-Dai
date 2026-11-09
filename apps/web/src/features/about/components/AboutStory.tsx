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
 * Câu chuyện thương hiệu, chia hai khối:
 * 1. Ảnh mở như kéo màn (trái) + lời kể (phải).
 * 2. Giải nghĩa tên: hai cột "Thiên" | "Canh" — chữ lớn trồi lên từng ký tự khi cuộn tới,
 *    cột "Canh" liệt kê hai tầng nghĩa của chữ.
 */
export function AboutStory() {
  const t = useTranslations("AboutPage.story");

  return (
    <section className={containerClassName({ spacing: "section" })}>
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-20">
        <figure className="relative isolate mx-auto w-full max-w-[520px] lg:mx-0">
          <ClipReveal className="aspect-[4/3] bg-(--bg-secondary) sm:aspect-[4/5]">
            <Image
              src="/images/ex5.jpg"
              alt={t("imageAlt")}
              fill
              sizes="(max-width: 1024px) 90vw, 520px"
              className="object-cover"
            />
          </ClipReveal>
          {/* Khung viền lệch phía sau ảnh — điểm nhấn kiểu ảnh tạp chí, ẩn ở mobile cho gọn */}
          <span
            aria-hidden="true"
            className="absolute -bottom-4 -right-4 -z-10 hidden h-full w-full border border-(--accent-color)/60 sm:block"
          />
          <figcaption className="mt-4 font-[family-name:var(--font-playfair)] text-sm italic text-(--text-light)">
            {t("imageCaption")}
          </figcaption>
        </figure>

        <div>
          <AboutHeading eyebrow={t("eyebrow")} title={t("title")} className="mb-8 sm:mb-10" />
          <div className="flex max-w-xl flex-col gap-5">
            {PARAGRAPH_KEYS.map((key, i) => (
              <Reveal key={key} delay={0.1 + i * 0.12}>
                <p className="text-base leading-8 text-(--text-main)/85">{t(`paragraphs.${key}`)}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-16 sm:mt-24">
        <Reveal>
          <p className="text-center text-[11px] font-semibold uppercase tracking-[3px] text-(--text-light)">
            {t("nameLabel")}
          </p>
        </Reveal>

        <dl className="mt-8 grid border-y border-(--border) md:grid-cols-[1fr_1.4fr]">
          <div className="py-8 md:py-12 md:pr-12">
            <BigWord word={t("meanings.sky.word")} />
            <dt className="mt-5 text-[11px] font-semibold uppercase tracking-[2.5px] text-(--primary-ink)">
              {t("meanings.sky.title")}
            </dt>
            <dd className="mt-2 max-w-sm text-[15px] leading-7 text-(--text-light)">{t("meanings.sky.text")}</dd>
          </div>

          <div className="border-t border-(--border) py-8 md:border-l md:border-t-0 md:py-12 md:pl-12">
            <BigWord word={t("meanings.grain.word")} delay={0.2} />
            <p className="mt-5 text-[11px] uppercase tracking-[2.5px] text-(--text-light)">{t("canhLabel")}</p>
            <div className="mt-4 grid gap-6 sm:grid-cols-2">
              {CANH_KEYS.map((key, i) => (
                <Reveal key={key} delay={0.3 + i * 0.12} className="border-l border-(--accent-color) pl-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-[2.5px] text-(--primary-ink)">
                    {t(`meanings.${key}.title`)}
                  </dt>
                  <dd className="mt-2 text-[15px] leading-7 text-(--text-light)">{t(`meanings.${key}.text`)}</dd>
                </Reveal>
              ))}
            </div>
          </div>
        </dl>
      </div>
    </section>
  );
}

/** Chữ lớn trồi lên từng ký tự từ sau mép che khi cuộn tới */
function BigWord({ word, delay = 0 }: { word: string; delay?: number }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.p
      aria-label={word}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0px 0px -15% 0px" }}
      className="flex overflow-hidden pb-2 font-[family-name:var(--font-playfair)] text-[3.5rem] italic leading-none text-(--accent-color) sm:text-[4.5rem]"
    >
      {Array.from(word).map((char, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          variants={{ hidden: { y: "110%" }, visible: { y: 0 } }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.9, delay: delay + i * 0.06, ease: EASE }}
          className="inline-block"
        >
          {char}
        </motion.span>
      ))}
    </motion.p>
  );
}
