export * from "./components/NewsCard";
export * from "./components/NewsClient";
export * from "./components/NewsDetail";
export * from "./types/news.types";
export * from "./hooks/useNews";
export * from "./hooks/useNewsDetail";

// Nội dung thân bài mock — chỉ dùng ở server (page chi tiết) để không đưa cả kho nội dung xuống client
export { getArticleCategoryKey, getArticleContent } from "./data/articleContent";
