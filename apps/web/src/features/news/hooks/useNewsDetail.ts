"use client";

import { useMemo } from "react";
import { useLocale } from "next-intl";
import { type MockArticle, getAuthor } from "../types/news.types";
import { getArticleCategoryKey, getArticleContent } from "../data/articleContent";

export function useNewsDetail(article: MockArticle) {
  const loc: "vi" | "en" = useLocale() === "en" ? "en" : "vi";
  const categoryKey = getArticleCategoryKey(article.category.en);

  const content = useMemo(
    () => getArticleContent(categoryKey, article.description[loc], loc),
    [categoryKey, article.description, loc]
  );

  return {
    loc,
    categoryKey,
    authorName: getAuthor(article.id),
    fullDate: article.dateLong[loc],
    content,
  };
}
