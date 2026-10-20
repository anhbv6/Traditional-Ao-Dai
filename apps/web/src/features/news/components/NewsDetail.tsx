"use client";

import React, { useRef } from "react";
import { MotionConfig } from "motion/react";
import { type MockArticle } from "../types/news.types";
import { useNewsDetail } from "../hooks/useNewsDetail";
import { useArticleEngagement } from "../hooks/useArticleEngagement";
import { NewsHeader } from "./detail/NewsHeader";
import { NewsBody } from "./detail/NewsBody";
import { NewsToc } from "./detail/NewsToc";
import { NewsShare } from "./detail/NewsShare";
import { NewsCta } from "./detail/NewsCta";
import { NewsPrevNext } from "./detail/NewsPrevNext";
import { NewsEngagement } from "./detail/NewsEngagement";
import { ReadingProgress } from "./detail/ReadingProgress";
import { RelatedNewsSidebar } from "./detail/RelatedNewsSidebar";
import { NEWS_BLOCK_CLASS } from "./detail/newsBlock";

interface NewsDetailProps {
  article: MockArticle;
  similarArticles: MockArticle[];
  /** Bài mới hơn / cũ hơn trong danh sách */
  previousArticle: MockArticle | null;
  nextArticle: MockArticle | null;
}

/**
 * Trang chi tiết bài viết — bố cục 3 cột, mỗi phần là một khối có khung riêng để người đọc tập trung vào bài:
 * - Trái (xl+): mục lục + chia sẻ, ghim khi cuộn. Dưới xl mục lục thu gọn ở đầu khối thân bài.
 * - Giữa: đầu bài → thân bài → lời kêu gọi → đánh giá & bình luận (chung một khối) → bài trước / sau.
 * - Phải (lg+): bài viết liên quan (không khung), ghim khi cuộn. Trên mobile xếp xuống cuối trang.
 */
export function NewsDetail({ article, similarArticles, previousArticle, nextArticle }: NewsDetailProps) {
  const { loc, categoryKey, authorName, fullDate, content } = useNewsDetail(article);
  const engagement = useArticleEngagement(article.id);
  const bodyRef = useRef<HTMLDivElement>(null);
  const title = article.title[loc];

  return (
    <MotionConfig reducedMotion="user">
      <ReadingProgress targetRef={bodyRef} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 xl:grid-cols-[190px_minmax(0,1fr)_300px]">
        <aside className="hidden xl:block">
          <div className="sticky top-28 space-y-8">
            <NewsToc sections={content.sections} variant="sidebar" />
            <NewsShare title={title} layout="column" />
          </div>
        </aside>

        <div className="min-w-0 space-y-6">
          <NewsHeader article={article} authorName={authorName} fullDate={fullDate} loc={loc} />

          <div ref={bodyRef} className={NEWS_BLOCK_CLASS}>
            <div className="xl:hidden">
              <NewsToc sections={content.sections} variant="inline" />
            </div>

            <NewsBody content={content} />

            <div className="mt-10 border-t border-[var(--border)] pt-6">
              <NewsShare title={title} />
            </div>
          </div>

          <NewsCta categoryKey={categoryKey} />
          <NewsEngagement engagement={engagement} />
          <NewsPrevNext previous={previousArticle} next={nextArticle} loc={loc} />
        </div>

        <aside className="min-w-0">
          <div className="lg:sticky lg:top-28">
            <RelatedNewsSidebar articles={similarArticles} loc={loc} />
          </div>
        </aside>
      </div>
    </MotionConfig>
  );
}
