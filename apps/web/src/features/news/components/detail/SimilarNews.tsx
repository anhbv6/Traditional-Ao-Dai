"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/shared/Reveal";
import { type MockArticle } from "../../types/news.types";
import { NewsCard } from "../NewsCard";

interface SimilarNewsProps {
  similarArticles: MockArticle[];
  loc: "vi" | "en";
}

/** Bài liên quan: dùng lại NewsCard (cùng thẻ với slider bản tin ở trang chủ) */
export function SimilarNews({ similarArticles, loc }: SimilarNewsProps) {
  const t = useTranslations("NewsPage");

  return (
    <section className="mt-20">
      <div className="mb-8 border-b border-[var(--text-main)]/80 pb-3">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--primary-color)] sm:text-[28px]">{t("similarNews")}</h2>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {similarArticles.map((item, i) => (
          <Reveal key={item.id} delay={i * 0.1}>
            <NewsCard
              slug={item.slug}
              category={item.category[loc]}
              title={item.title[loc]}
              description={item.description[loc]}
              dateShort={item.dateShort[loc]}
              dateLong={item.dateLong[loc]}
              imageSrc={item.imageSrc}
              readTime={item.readTime[loc]}
              readMoreLabel={t("readMore")}
            />
          </Reveal>
        ))}
      </div>
    </section>
  );
}
