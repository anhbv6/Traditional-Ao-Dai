export interface AdminArticleItem {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  thumbnail?: string | null;
  isPublished: boolean;
  authorName?: string | null;
  createdAt: Date | string;
}

export interface AdminFaqItem {
  id: string;
  question: string;
  answer: string;
  category?: string | null;
  order: number;
  isActive: boolean;
}
