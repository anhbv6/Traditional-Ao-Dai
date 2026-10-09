"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";

const HERO_BADGES = ["armhole", "belly", "realFit"] as const;
const EASE = [0.22, 1, 0.36, 1] as const;

/** Chữ hiện lần lượt khi vào trang — mỗi dòng trễ hơn dòng trước một nhịp */
const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 1, delay, ease: EASE },
});

/**
 * Hero nền tối (khác hero sáng của trang chủ): ảnh tràn mép trái, chữ trắng trên nền đỏ thẫm bên phải.
 * Ảnh thu nhỏ chậm khi vào trang (Ken Burns) và trôi nhẹ khi cuộn.
 */
export function AboutHero() {
  const t = useTranslations("AboutPage.hero");
  const reduceMotion = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const imageY = useTransform(scrollYProgress, [0, 1], reduceMotion ? ["0%", "0%"] : ["0%", "12%"]);

  return (
    <section ref={sectionRef} className="grid overflow-hidden bg-[#2A0A12] text-white lg:min-h-[calc(100svh-150px)] lg:grid-cols-2">
      <div className="relative min-h-[420px] overflow-hidden sm:min-h-[520px]">
        <motion.div
          style={{ y: imageY }}
          // initial giống nhau ở server/client (tránh hydration mismatch); giảm chuyển động -> thời lượng 0
          initial={{ scale: 1.15 }}
          animate={{ scale: 1 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 2.4, ease: EASE }}
          className="absolute inset-0"
        >
          <Image
            src="/login_banner.jpg"
            alt={t("imageAlt")}
            fill
            loading="eager"
            fetchPriority="high"
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover object-[50%_30%]"
          />
        </motion.div>
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#2A0A12]/70 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#2A0A12]/40" />
        <p className="absolute bottom-5 left-5 text-[10px] uppercase tracking-[3px] text-white/70 sm:left-8">{t("since")}</p>
      </div>

      <div className="flex flex-col justify-center px-5 py-14 sm:px-10 sm:py-20 lg:px-16 xl:px-20">
        <motion.p {...fadeUp(0.2)} className="text-[11px] font-semibold uppercase tracking-[3.5px] text-[var(--accent-color)]">
          {t("eyebrow")}
        </motion.p>
        <motion.h1
          {...fadeUp(0.32)}
          className="mt-5 max-w-xl font-[family-name:var(--font-playfair)] text-[36px] font-semibold leading-[1.1] text-white sm:text-[50px] xl:text-[58px]"
        >
          {t("title")}
        </motion.h1>
        <motion.p {...fadeUp(0.44)} className="mt-6 max-w-lg text-base leading-8 text-white/75">
          {t("subtitle")}
        </motion.p>

        <motion.ul {...fadeUp(0.56)} className="mt-8 flex flex-col gap-2.5 border-l border-[var(--accent-color)]/60 pl-5">
          {HERO_BADGES.map((key) => (
            <li key={key} className="text-sm text-white/90">
              {t(`badges.${key}`)}
            </li>
          ))}
        </motion.ul>

        <motion.div {...fadeUp(0.68)} className="mt-10">
          <Link
            href="/contact"
            className="group inline-flex min-h-12 items-center gap-4 border-b border-white/40 pb-2 text-xs font-semibold uppercase tracking-[2.5px] text-white transition-colors duration-300 hover:border-[var(--accent-color)] hover:text-[var(--accent-color)]"
          >
            {t("primaryAction")}
            <ArrowRight size={16} strokeWidth={1.4} className="transition-transform duration-500 group-hover:translate-x-1.5" />
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
