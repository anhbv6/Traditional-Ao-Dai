/** Một dòng bài viết ở danh sách (ngày giờ dạng ISO để truyền qua Server Component) */
export interface AdminArticleRow {
  id: string;
  title: string;
  titleEn: string | null;
  slug: string;
  excerpt: string | null;
  thumbnail: string | null;
  isPublished: boolean;
  authorName: string | null;
  /** Số từ phần tiếng Việt — để ước thời gian đọc mà không gửi cả thân bài ra danh sách */
  words: number;
  hasEnglish: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Bài viết đầy đủ cho màn soạn */
export interface AdminArticle extends AdminArticleRow {
  excerptEn: string | null;
  content: string;
  contentEn: string | null;
}

export interface ArticleEditorData {
  /** null = viết bài mới */
  article: AdminArticle | null;
  /** Slug các bài khác — báo trùng ngay khi gõ (server vẫn kiểm tra lại) */
  takenSlugs: string[];
}

export interface AdminFaq {
  id: string;
  question: string;
  questionEn: string | null;
  answer: string;
  answerEn: string | null;
  /** Mã chủ đề khớp FAQ_TOPICS của storefront; null = chưa phân loại */
  category: string | null;
  order: number;
  isActive: boolean;
  updatedAt: string;
}

export interface CmsBoardData {
  articles: AdminArticleRow[];
  faqs: AdminFaq[];
}

/** Giá trị form bài viết (gửi lên Server Action) */
export interface ArticleFormValues {
  title: string;
  titleEn: string;
  slug: string;
  excerpt: string;
  excerptEn: string;
  content: string;
  contentEn: string;
  thumbnail: string | null;
  isPublished: boolean;
}

export interface FaqFormValues {
  question: string;
  questionEn: string;
  answer: string;
  answerEn: string;
  category: string;
  isActive: boolean;
}
