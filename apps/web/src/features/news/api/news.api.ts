import { mockArticles, type MockArticle } from "../data/mockArticles";

/**
 * Fetch all available news articles
 */
export const fetchArticles = async (): Promise<MockArticle[]> => {
  return Promise.resolve(mockArticles);
};

/**
 * Fetch a single news article by its slug
 */
export const fetchArticleBySlug = async (slug: string): Promise<MockArticle | null> => {
  const article = mockArticles.find((item) => item.slug === slug);
  return Promise.resolve(article || null);
};
