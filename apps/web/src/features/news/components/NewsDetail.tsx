"use client";

import React from "react";
import { Container } from "@/components/ui/container";
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
    <Container as="article" className="max-w-4xl py-8 sm:py-12">
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
    </Container>
  );
}
