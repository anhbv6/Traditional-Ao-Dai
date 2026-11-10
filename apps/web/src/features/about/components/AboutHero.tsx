"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { ActionLink } from "@/components/shared/ActionLink";
import { ON_PRIMARY_COLORS } from "@/components/shared/ActionButton";

const HERO_BADGES = ["grain", "measure", "handStitch"] as const;
const EASE = [0.22, 1, 0.36, 1] as const;

/** Chuyển động nhẹ nhàng, dứt khoát theo tiêu chuẩn Minimalism (200-300ms hoặc stagger mượt mà) */
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, delay, ease: EASE },
});

/**
 * Hero trang Câu chuyện (Minimalism Style):
 * - Bố cục lưới kiến trúc 2 cột cân xứng, tách bạch bởi đường chia hairline.
 * - Ảnh thực cảnh chân thực, sắc nét, không lớp phủ gradient đục.
 * - Toàn bộ văn bản đạt độ tương phản tối thiểu từ 8:1 trở lên trên nền rượu vang sẫm (--bg-wine).
 */
export function AboutHero() {
  const t = useTranslations("AboutPage.hero");
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], reduceMotion ? ["0%", "0%"] : ["0%", "8%"]);

  return (
    <section
      ref={sectionRef}
      className="grid border-b border-(--border)/20 bg-(--bg-wine) text-white lg:min-h-[calc(100svh-140px)] lg:grid-cols-2"
    >
      {/* Cột ảnh: Sắc sảo, chuẩn tỉ lệ, nhãn chỉ dẫn tối giản góc dưới */}
      <div className="relative min-h-[380px] overflow-hidden border-b border-(--border)/15 sm:min-h-[480px] lg:border-b-0 lg:border-r">
        <motion.div
          style={{ y: imageY }}
          initial={{ scale: 1.06 }}
          animate={{ scale: 1 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 1.6, ease: EASE }}
          className="absolute inset-0"
        >
          <Image
            src="/images/ex6.jpg"
            alt={t("imageAlt")}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-[50%_25%]"
          />
        </motion.div>

        {/* Lớp che mờ tối giản bảo vệ độ tương phản của nhãn góc dưới */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-(--bg-wine)/90 to-transparent"
        />
        <p className="absolute bottom-6 left-6 text-xs font-medium uppercase tracking-[0.2em] text-white/90 sm:bottom-8 sm:left-10">
          {t("since")}
        </p>
      </div>

      {/* Cột nội dung: Typography cao cấp, khoảng đệm hào phóng */}
      <div className="flex flex-col justify-center px-6 py-14 sm:px-12 sm:py-20 lg:px-16 xl:px-24">
        <motion.div {...fadeUp(0.15)} className="flex items-center gap-3">
          <span aria-hidden="true" className="h-px w-6 bg-(--accent-on-primary)/60" />
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-(--accent-on-primary)">
            {t("eyebrow")}
          </p>
        </motion.div>

        <motion.h1
          {...fadeUp(0.25)}
          className="mt-5 max-w-xl font-[family-name:var(--font-playfair)] text-[2.5rem] font-semibold leading-[1.15] text-white sm:text-[3rem] lg:text-[3.5rem]"
        >
          {t("title")}
        </motion.h1>

        <motion.p
          {...fadeUp(0.35)}
          className="mt-6 max-w-lg text-base leading-relaxed text-white/90 sm:text-lg sm:leading-relaxed"
        >
          {t("subtitle")}
        </motion.p>

        {/* Danh sách 3 cam kết thủ công: Tối giản, thanh mảnh, tương phản cao */}
        <ul className="mt-8 flex flex-col gap-3.5 border-t border-(--border)/20 pt-8 sm:mt-10">
          {HERO_BADGES.map((key, i) => (
            <motion.li
              key={key}
              {...fadeUp(0.45 + i * 0.08)}
              className="flex items-center gap-3 text-sm text-white/95"
            >
              <span aria-hidden="true" className="h-px w-5 bg-(--accent-on-primary)/60" />
              <span className="font-medium tracking-wide">{t(`badges.${key}`)}</span>
            </motion.li>
          ))}
        </ul>

        <motion.div {...fadeUp(0.7)} className="mt-10 sm:mt-12">
          <ActionLink
            href="/contact"
            variant="custom"
            size="lg"
            colors={ON_PRIMARY_COLORS.outline}
            icon={<ArrowRight strokeWidth={1.8} />}
            iconPosition="end"
          >
            {t("primaryAction")}
          </ActionLink>
        </motion.div>
      </div>
    </section>
  );
}
