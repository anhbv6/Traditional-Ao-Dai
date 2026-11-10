"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useTranslations } from "next-intl";
import { containerClassName } from "@/components/layout/Container";

/**
 * Khối Triết lý thương hiệu (Minimalism Style):
 * - Bố cục Editorial tĩnh tại, trang nhã, bỏ chữ xoay dọc gây khó đọc.
 * - Hiệu ứng cuộn sáng chữ giữ mức tương phản cơ sở tối thiểu 4.8:1 (không bao giờ mờ tịt dưới 4.5:1).
 * - Nhãn định danh và trích dẫn chuẩn nét, thanh lịch.
 */
export function AboutManifesto() {
  const t = useTranslations("AboutPage.manifesto");
  const textRef = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: textRef, offset: ["start 0.85", "end 0.45"] });

  const words = t("text").split(" ");

  return (
    <section className="border-y border-(--border) bg-(--bg-secondary)">
      <div
        className={containerClassName({
          spacing: "section",
          className: "mx-auto max-w-4xl py-16 sm:py-24",
        })}
      >
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="h-px w-6 bg-(--primary-ink)/40" />
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-(--primary-ink)">
            {t("eyebrow")}
          </p>
        </div>

        <blockquote className="mt-8 sm:mt-10">
          <p
            ref={textRef}
            className="font-[family-name:var(--font-playfair)] text-[1.625rem] font-medium leading-[1.4] text-(--heading-color) sm:text-[2.25rem] lg:text-[2.625rem]"
          >
            &ldquo;
            {words.map((word, i) => (
              <Word key={i} progress={scrollYProgress} range={[i / words.length, (i + 1) / words.length]}>
                {word}
              </Word>
            ))}
            &rdquo;
          </p>

          <footer className="mt-8 flex items-center gap-3 sm:mt-10">
            <span aria-hidden="true" className="h-px w-8 bg-(--primary-ink)/35" />
            <cite className="text-xs font-semibold not-italic uppercase tracking-[0.2em] text-(--text-main)">
              {t("author")}
            </cite>
          </footer>
        </blockquote>
      </div>
    </section>
  );
}

/** Từng từ sáng dần theo nhịp cuộn; độ mờ tối thiểu là 0.52 đảm bảo tương phản đạt chuẩn >= 4.8:1 */
function Word({
  children,
  progress,
  range,
}: {
  children: string;
  progress: MotionValue<number>;
  range: [number, number];
}) {
  const opacity = useTransform(progress, range, [0.52, 1]);
  return (
    <motion.span style={{ opacity }} className="motion-reduce:opacity-100!">
      {children}{" "}
    </motion.span>
  );
}
