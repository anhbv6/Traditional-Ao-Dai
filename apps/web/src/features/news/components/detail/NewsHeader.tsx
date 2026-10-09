"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { useTranslations } from "next-intl";
import { type MockArticle } from "../../types/news.types";

const EASE = [0.22, 1, 0.36, 1] as const;

interface NewsHeaderProps {
  article: MockArticle;
  authorName: string;
  fullDate: string;
  loc: "vi" | "en";
}

/**
 * Đầu bài kiểu tạp chí:
 * - Danh mục có vạch kẻ chạy ra, tiêu đề hiện lần lượt TỪNG CHỮ trồi lên từ dưới mặt nạ.
 * - Ảnh bìa hé lộ như kéo tấm màn, khi cuộn ảnh trôi chậm hơn trang (parallax nhẹ).
 */
export function NewsHeader({ article, authorName, fullDate, loc }: NewsHeaderProps) {
  const t = useTranslations("NewsPage");
  const coverRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: coverRef, offset: ["start end", "end start"] });
  const coverY = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);
  const words = article.title[loc].split(" ");

  return (
    <header className="mb-10 sm:mb-14">
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[3px] text-[var(--primary-color)] sm:text-[11px]"
        >
          <motion.span
            aria-hidden="true"
            className="h-px w-8 origin-right bg-[var(--primary-color)]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, ease: EASE }}
          />
          {article.category[loc]}
          <motion.span
            aria-hidden="true"
            className="h-px w-8 origin-left bg-[var(--primary-color)]"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, ease: EASE }}
          />
        </motion.p>

        <h1 className="mt-4 text-[26px] font-semibold leading-tight text-[var(--primary-color)] sm:text-[36px] md:text-[42px]">
          <span className="sr-only">{article.title[loc]}</span>
          <span aria-hidden="true">
            {words.map((word, index) => (
              <span key={`${word}-${index}`} className="inline-block overflow-hidden pb-1 align-bottom">
                <motion.span
                  className="inline-block"
                  initial={{ y: "110%" }}
                  animate={{ y: 0 }}
                  transition={{ duration: 0.8, delay: 0.15 + index * 0.045, ease: EASE }}
                >
                  {word}
                  {index < words.length - 1 ? " " : ""}
                </motion.span>
              </span>
            ))}
          </span>
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: EASE }}
          className="mt-4 max-w-2xl text-[14px] leading-7 text-[var(--text-light)] sm:text-[15px]"
        >
          {article.description[loc]}
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-y border-[var(--border)] py-3.5 text-[11px] text-[var(--text-light)] sm:text-xs"
      >
        <span>
          <span className="uppercase tracking-[2px]">{t("author")}</span>{" "}
          <span className="font-semibold text-[var(--text-main)]">{authorName}</span>
        </span>
        <span aria-hidden="true" className="size-1 rotate-45 bg-[var(--accent-color)]" />
        <time>{fullDate}</time>
        <span aria-hidden="true" className="size-1 rotate-45 bg-[var(--accent-color)]" />
        <span>{article.readTime[loc]}</span>
      </motion.div>

      <motion.div
        ref={coverRef}
        initial={{ clipPath: "inset(100% 0% 0% 0%)" }}
        animate={{ clipPath: "inset(0% 0% 0% 0%)" }}
        transition={{ duration: 1.3, delay: 0.35, ease: EASE }}
        className="relative mt-8 aspect-[16/10] w-full overflow-hidden bg-[var(--bg-secondary)] sm:mt-10 md:aspect-[21/9]"
      >
        <motion.div className="absolute inset-[-8%_0]" style={{ y: coverY }}>
          <motion.div
            className="absolute inset-0"
            initial={{ scale: 1.15 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.8, delay: 0.35, ease: EASE }}
          >
            <Image
              src={article.imageSrc}
              alt={article.title[loc]}
              fill
              loading="eager"
              fetchPriority="high"
              sizes="(max-width: 1200px) 100vw, 1100px"
              className="object-cover"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </header>
  );
}
