"use client";

import React from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { type ArticleCategoryKey } from "../../data/articleContent";

interface NewsCtaProps {
  categoryKey: ArticleCategoryKey;
}

/** Khối kêu gọi hành động cuối bài: dẫn khách từ nội dung sang sản phẩm / dịch vụ phù hợp */
export function NewsCta({ categoryKey }: NewsCtaProps) {
  const t = useTranslations("NewsPage");
  // Bài may đo -> đặt lịch may đo; bài khác -> bộ sưu tập liên quan qua tìm kiếm `?q=` (từ khóa theo ngôn ngữ)
  const href =
    categoryKey === "tailoring"
      ? "/contact"
      : `/products?q=${encodeURIComponent(t(`cta.${categoryKey}.keyword`))}#product-list`;

  return (
    <motion.aside
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      className="relative mt-14 overflow-hidden bg-[var(--primary-color)] px-6 py-9 text-white sm:px-10 sm:py-11"
    >
      {/* Hoa văn hình thoi mờ trang trí góc phải */}
      <span aria-hidden="true" className="absolute -right-10 -top-10 size-40 rotate-45 border border-white/15" />
      <span aria-hidden="true" className="absolute -right-4 -top-4 size-28 rotate-45 border border-white/10" />

      <p className="text-[10px] uppercase tracking-[3px] text-white/70">{t(`cta.${categoryKey}.eyebrow`)}</p>
      <h2 className="mt-3 max-w-lg text-[22px] font-semibold leading-snug text-white sm:text-[28px]">{t(`cta.${categoryKey}.title`)}</h2>
      <p className="mt-3 max-w-lg text-[13px] leading-6 text-white/80 sm:text-sm">{t(`cta.${categoryKey}.description`)}</p>
      <Link
        href={href}
        className="group/cta relative mt-6 inline-flex min-h-11 items-center gap-2 overflow-hidden bg-white px-6 text-[11px] font-semibold uppercase tracking-[2px] text-[var(--primary-color)]"
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 origin-left scale-x-0 bg-[var(--accent-color)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/cta:scale-x-100"
        />
        <span className="relative flex items-center gap-2 transition-colors duration-500 group-hover/cta:text-white">
          {t(`cta.${categoryKey}.action`)}
          <ArrowRight size={14} className="transition-transform duration-300 group-hover/cta:translate-x-1" />
        </span>
      </Link>
    </motion.aside>
  );
}
