"use client";

import { useLocale } from "next-intl";
import { type MockArticle, getAuthor } from "../types/news.types";

/**
 * Thông tin hiển thị của bài viết theo ngôn ngữ hiện tại.
 * Thân bài (`content`) được dựng sẵn ở server (page.tsx) và truyền vào qua props —
 * kho nội dung mock của mọi bài (`data/articleContent`) không bị đưa xuống trình duyệt.
 */
export function useNewsDetail(article: MockArticle) {
  const loc: "vi" | "en" = useLocale() === "en" ? "en" : "vi";

  return {
    loc,
    authorName: getAuthor(article.id),
    fullDate: article.dateLong[loc],
  };
}
