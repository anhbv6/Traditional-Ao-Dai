"use client";

import { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { mockArticles } from "../data/mockArticles";
import { categoryFilterMap } from "../types/news.types";

export function useNews() {
  const locale = useLocale() as 'vi' | 'en';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Filter articles based on selected category
  const filteredArticles = useMemo(() => {
    if (selectedCategory === 'all') {
      return mockArticles;
    }
    return mockArticles.filter((article) => {
      const filter = categoryFilterMap[selectedCategory];
      if (!filter) return false;
      return (
        article.category.vi.toLowerCase() === filter.vi.toLowerCase() ||
        article.category.en.toLowerCase() === filter.en.toLowerCase()
      );
    });
  }, [selectedCategory]);

  // Extract slices for sequential layouts
  const heroArticle = filteredArticles[0];
  const latestNewsArticles = useMemo(() => filteredArticles.slice(1, 4), [filteredArticles]);
  const leftLatestArticle = latestNewsArticles[0];
  const rightLatestArticles = useMemo(() => latestNewsArticles.slice(1, 3), [latestNewsArticles]);

  const trendsArticles = useMemo(() => filteredArticles.slice(4, 8), [filteredArticles]);
  const guidesArticles = useMemo(() => filteredArticles.slice(8, 14), [filteredArticles]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    // Scroll smoothly to top of articles after filter change
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return {
    selectedCategory,
    filteredArticles,
    heroArticle,
    latestNewsArticles,
    leftLatestArticle,
    rightLatestArticles,
    trendsArticles,
    guidesArticles,
    handleCategoryChange,
    locale,
  };
}
