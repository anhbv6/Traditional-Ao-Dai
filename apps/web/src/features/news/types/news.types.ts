import { mockArticles, type MockArticle } from "../data/mockArticles";

export type { MockArticle };
export { mockArticles };

export const categoryKeys = ['all', 'guide', 'tips', 'culture', 'trends', 'tailoring'] as const;

export type CategoryKey = typeof categoryKeys[number];

export const categoryFilterMap: Record<string, { vi: string; en: string }> = {
  guide: { vi: 'Cẩm Nang', en: 'Guide' },
  tips: { vi: 'Kinh Nghiệm', en: 'Tips' },
  culture: { vi: 'Văn Hóa', en: 'Culture' },
  trends: { vi: 'Xu Hướng', en: 'Trends' },
  tailoring: { vi: 'May Đo', en: 'Tailoring' },
};

export const authors = ['Guy Hawkins', 'Jenny Wilson', 'Kristin Watson', 'Albert Flores', 'Eleanor Pena'] as const;

export const getAuthor = (id: string) => {
  const index = parseInt(id, 10);
  return isNaN(index) ? 'Guy Hawkins' : (authors[index % authors.length] || 'Guy Hawkins');
};
