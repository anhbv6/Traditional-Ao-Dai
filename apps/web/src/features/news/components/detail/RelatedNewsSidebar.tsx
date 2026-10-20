"use client";

import React from "react";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { type MockArticle } from "../../types/news.types";
import { NEWS_BLOCK_TITLE_CLASS } from "./newsBlock";

interface RelatedNewsSidebarProps {
  articles: MockArticle[];
  loc: "vi" | "en";
}

/** Cột phải (không khung, nằm thẳng trên nền trang): danh sách bài liên quan dạng gọn (ảnh nhỏ + danh mục + tiêu đề + ngày), thay cho băng chuyền cuối trang */
export function RelatedNewsSidebar({ articles, loc }: RelatedNewsSidebarProps) {
  const t = useTranslations("NewsPage");
  if (articles.length === 0) return null;

  return (
    <section aria-labelledby="related-news-heading">
      <h2 id="related-news-heading" className={`${NEWS_BLOCK_TITLE_CLASS} border-b border-[var(--border)] pb-3`}>
        {t("similarNews")}
      </h2>

      <ul className="divide-y divide-[var(--border)]">
        {articles.map((article) => (
          <li key={article.id}>
            <Link href={`/news/${article.slug}`} className="group flex gap-3.5 py-4">
              <span className="relative aspect-[4/3] w-24 shrink-0 overflow-hidden bg-[var(--bg-secondary)]">
                <Image
                  src={article.imageSrc}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-110"
                />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-semibold uppercase tracking-[2px] text-[var(--primary-ink)]">
                  {article.category[loc]}
                </span>
                <span className="mt-1 line-clamp-2 text-[14px] font-semibold leading-snug text-[var(--text-main)] transition-colors group-hover:text-[var(--primary-ink)]">
                  {article.title[loc]}
                </span>
                <span className="mt-1.5 block text-[11px] text-[var(--text-light)]">
                  {article.dateShort[loc]} · {article.readTime[loc]}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <Link
        href="/news"
        className="group mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[2px] text-[var(--primary-ink)]"
      >
        {t("backToNews")}
        <ArrowRight size={13} className="transition-transform duration-300 group-hover:translate-x-1" />
      </Link>
    </section>
  );
}
