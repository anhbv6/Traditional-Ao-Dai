"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { type MockArticle } from "../../types/news.types";
import { NEWS_BLOCK_TITLE_CLASS } from "./newsBlock";
import { NewsCard } from "../NewsCard";

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
            <NewsCard variant="compact" article={article} locale={loc} className="py-4" />
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
