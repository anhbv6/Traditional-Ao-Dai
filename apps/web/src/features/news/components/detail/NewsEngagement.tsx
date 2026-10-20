"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { type ArticleEngagement } from "../../hooks/useArticleEngagement";
import { NewsFeedback } from "./NewsFeedback";
import { NewsComments } from "./NewsComments";
import { NEWS_BLOCK_CLASS, NEWS_BLOCK_TITLE_CLASS } from "./newsBlock";

interface NewsEngagementProps {
  engagement: ArticleEngagement;
}

/** Một khối chung "Đánh giá & bình luận": phần đánh giá ở trên, bình luận ở dưới, ngăn bằng vạch kẻ */
export function NewsEngagement({ engagement }: NewsEngagementProps) {
  const t = useTranslations("NewsPage.feedback");

  return (
    <section aria-labelledby="news-engagement-heading" className={NEWS_BLOCK_CLASS}>
      <h2 id="news-engagement-heading" className={`${NEWS_BLOCK_TITLE_CLASS} mb-5`}>
        {t("title")}
      </h2>
      <NewsFeedback engagement={engagement} />
      <NewsComments engagement={engagement} />
    </section>
  );
}
