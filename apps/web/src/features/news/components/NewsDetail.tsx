"use client";

import React from "react";
import { type MockArticle } from "../types/news.types";
import { useNewsDetail } from "../hooks/useNewsDetail";
import { NewsHeader } from "./detail/NewsHeader";
import { NewsBody } from "./detail/NewsBody";
import { SimilarNews } from "./detail/SimilarNews";

interface NewsDetailProps {
  article: MockArticle;
  similarArticles: MockArticle[];
}

export function NewsDetail({ article, similarArticles }: NewsDetailProps) {
  const { authorName, fullDate, content, locale } = useNewsDetail(article);
  const loc = locale === "vi" ? "vi" : "en";

  return (
    <>
      <NewsHeader
        article={article}
        authorName={authorName}
        fullDate={fullDate}
        loc={loc}
      />
      
      <NewsBody content={content} />
      
      <SimilarNews
        similarArticles={similarArticles}
        loc={loc}
      />
    </>
  );
}
