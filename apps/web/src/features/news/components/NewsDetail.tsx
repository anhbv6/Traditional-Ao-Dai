"use client";

import React, { useRef } from "react";
import { MotionConfig } from "motion/react";
import { type MockArticle } from "../types/news.types";
import { useNewsDetail } from "../hooks/useNewsDetail";
import { NewsHeader } from "./detail/NewsHeader";
import { NewsBody } from "./detail/NewsBody";
import { NewsToc } from "./detail/NewsToc";
import { NewsShare } from "./detail/NewsShare";
import { NewsCta } from "./detail/NewsCta";
import { NewsPrevNext } from "./detail/NewsPrevNext";
import { ReadingProgress } from "./detail/ReadingProgress";
import { SimilarNews } from "./detail/SimilarNews";

interface NewsDetailProps {
  article: MockArticle;
  similarArticles: MockArticle[];
  /** Bài mới hơn / cũ hơn trong danh sách */
  previousArticle: MockArticle | null;
  nextArticle: MockArticle | null;
}

/**
 * Trang chi tiết bài viết: thanh tiến độ đọc, đầu bài kiểu tạp chí, mục lục + chia sẻ dính bên trái (desktop),
 * thân bài, lời kêu gọi theo danh mục, bài trước/sau và bài liên quan.
 */
export function NewsDetail({ article, similarArticles, previousArticle, nextArticle }: NewsDetailProps) {
  const { loc, categoryKey, authorName, fullDate, content } = useNewsDetail(article);
  const bodyRef = useRef<HTMLDivElement>(null);
  const title = article.title[loc];

  return (
    <MotionConfig reducedMotion="user">
      <ReadingProgress targetRef={bodyRef} />

      <NewsHeader article={article} authorName={authorName} fullDate={fullDate} loc={loc} />

      <div ref={bodyRef} className="grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-14">
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-8">
            <NewsToc sections={content.sections} variant="sidebar" />
            <NewsShare title={title} layout="column" />
          </div>
        </aside>

        <div className="mx-auto w-full max-w-2xl lg:mx-0">
          <div className="lg:hidden">
            <NewsToc sections={content.sections} variant="inline" />
          </div>

          <NewsBody content={content} />

          <div className="mt-10 border-t border-[var(--border)] pt-6">
            <NewsShare title={title} />
          </div>

          <NewsCta categoryKey={categoryKey} />
          <NewsPrevNext previous={previousArticle} next={nextArticle} loc={loc} />
        </div>
      </div>

      <SimilarNews similarArticles={similarArticles} loc={loc} />
    </MotionConfig>
  );
}
