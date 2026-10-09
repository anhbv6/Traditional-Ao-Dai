"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/shared/Reveal";
import { type MockArticle } from "../../types/news.types";

interface NewsPrevNextProps {
  previous: MockArticle | null;
  next: MockArticle | null;
  loc: "vi" | "en";
}

/** Điều hướng bài mới hơn / cũ hơn: ảnh nhỏ phóng nhẹ và mũi tên trượt khi rê chuột */
export function NewsPrevNext({ previous, next, loc }: NewsPrevNextProps) {
  const t = useTranslations("NewsPage");
  if (!previous && !next) return null;

  const card = (article: MockArticle, direction: "previous" | "next") => (
    <Link
      href={`/news/${article.slug}`}
      className={`group flex items-center gap-4 border border-[var(--border)] bg-white p-3 transition-colors duration-300 hover:border-[var(--primary-color)] ${
        direction === "next" ? "flex-row-reverse text-right" : ""
      }`}
    >
      <span className="relative aspect-square w-16 shrink-0 overflow-hidden bg-[var(--bg-secondary)] sm:w-20">
        <Image
          src={article.imageSrc}
          alt=""
          fill
          sizes="80px"
          className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
        />
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`flex items-center gap-1.5 text-[10px] uppercase tracking-[2px] text-[var(--text-light)] ${
            direction === "next" ? "justify-end" : ""
          }`}
        >
          {direction === "previous" ? (
            <ArrowLeft size={12} className="transition-transform duration-300 group-hover:-translate-x-1" />
          ) : null}
          {t(direction === "previous" ? "previousArticle" : "nextArticle")}
          {direction === "next" ? (
            <ArrowRight size={12} className="transition-transform duration-300 group-hover:translate-x-1" />
          ) : null}
        </span>
        <span className="mt-1 line-clamp-2 font-[family-name:var(--font-playfair)] text-[14px] font-semibold leading-snug text-[var(--text-main)] transition-colors group-hover:text-[var(--primary-color)] sm:text-[15px]">
          {article.title[loc]}
        </span>
      </span>
    </Link>
  );

  return (
    <Reveal>
      <nav aria-label={t("articleNavigation")} className="mt-12 grid gap-3 sm:grid-cols-2">
        <div>{previous ? card(previous, "previous") : null}</div>
        <div>{next ? card(next, "next") : null}</div>
      </nav>
    </Reveal>
  );
}
