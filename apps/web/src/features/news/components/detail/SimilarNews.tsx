"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { ContentCarousel } from "@/components/shared/ContentCarousel";
import { type MockArticle } from "../../types/news.types";
import { NewsCard } from "../NewsCard";

interface SimilarNewsProps {
  similarArticles: MockArticle[];
  loc: "vi" | "en";
}

/** Bài liên quan: băng chuyền giống Sản phẩm liên quan, thẻ dùng lại NewsCard (cùng thẻ với bản tin trang chủ) */
export function SimilarNews({ similarArticles, loc }: SimilarNewsProps) {
  const t = useTranslations("NewsPage");

  return (
    <ContentCarousel
      className="mt-14 sm:mt-16 lg:mt-20"
      title={t("similarNews")}
      items={similarArticles}
      getKey={(item) => item.id}
      slideClassName="basis-[82%] sm:basis-1/2 lg:basis-1/3"
      renderItem={(item) => (
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
      )}
    />
  );
}
