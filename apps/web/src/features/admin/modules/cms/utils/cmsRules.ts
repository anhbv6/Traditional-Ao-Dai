import { FAQ_TOPICS } from "@/features/faqs";

/*
 * Luật nội dung dùng chung cho màn soạn (kiểm tra, xem trước) và Server Action (server kiểm tra lại khi lưu / đăng).
 */

/** Chủ đề FAQ — đúng thứ tự và mã của trang FAQs ở cửa hàng */
export const CMS_FAQ_TOPICS = FAQ_TOPICS;
export type CmsFaqTopic = (typeof CMS_FAQ_TOPICS)[number];
export const isFaqTopic = (value: string | null | undefined): value is CmsFaqTopic =>
  Boolean(value) && (CMS_FAQ_TOPICS as readonly string[]).includes(value as string);

export const ARTICLE_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const ARTICLE_LIMITS = {
  title: 120,
  slug: 80,
  excerpt: 300,
  content: 30_000,
  /** Đoạn mô tả Google thường hiện ~150–160 ký tự */
  excerptIdealMin: 80,
  excerptIdealMax: 160,
  /** Thân bài tối thiểu để đăng (~ hai đoạn ngắn) */
  minPublishWords: 120,
} as const;
export const FAQ_LIMITS = { question: 200, answer: 2_000 } as const;

const WORDS_PER_MINUTE = 200;

export const countWords = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);
export const readingMinutes = (words: number) => Math.max(1, Math.round(words / WORDS_PER_MINUTE));

export type ContentBlock = { type: "heading"; text: string } | { type: "paragraph"; text: string } | { type: "quote"; text: string };

/**
 * Định dạng thân bài tối giản (gõ được ngay trong ô chữ, không cần trình soạn thảo): dòng "## " là tiêu đề mục (dùng làm
 * mục lục), dòng "> " là lời trích, còn lại là đoạn văn — ngăn bằng một dòng trống.
 */
export function parseContent(content: string): ContentBlock[] {
  return content
    .split(/\n\s*\n/)
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      if (chunk.startsWith("## ")) return { type: "heading" as const, text: chunk.slice(3).trim() };
      if (chunk.startsWith("> ")) return { type: "quote" as const, text: chunk.replace(/^>\s?/gm, "").trim() };
      return { type: "paragraph" as const, text: chunk.replace(/\s*\n\s*/g, " ") };
    });
}

export type ArticleIssue = "TITLE" | "SLUG" | "SLUG_TAKEN" | "EXCERPT" | "THUMBNAIL" | "CONTENT_SHORT" | "NO_HEADING" | "EXCERPT_LENGTH" | "NO_ENGLISH";

/** Mức độ: `block` = không đăng được, `warn` = đăng được nhưng nên sửa */
export const ARTICLE_ISSUE_LEVEL: Record<ArticleIssue, "block" | "warn"> = {
  TITLE: "block",
  SLUG: "block",
  SLUG_TAKEN: "block",
  EXCERPT: "block",
  THUMBNAIL: "block",
  CONTENT_SHORT: "block",
  NO_HEADING: "warn",
  EXCERPT_LENGTH: "warn",
  NO_ENGLISH: "warn",
};

/** Kiểm tra trước khi đăng — server dùng đúng hàm này để chặn đăng bài thiếu */
export function articleIssues(
  values: { title: string; titleEn: string; slug: string; excerpt: string; content: string; contentEn: string; thumbnail: string | null },
  takenSlugs: readonly string[] = []
): ArticleIssue[] {
  const issues: ArticleIssue[] = [];
  if (!values.title.trim()) issues.push("TITLE");
  if (!ARTICLE_SLUG_REGEX.test(values.slug)) issues.push("SLUG");
  else if (takenSlugs.includes(values.slug)) issues.push("SLUG_TAKEN");
  if (!values.excerpt.trim()) issues.push("EXCERPT");
  if (!values.thumbnail) issues.push("THUMBNAIL");
  if (countWords(values.content) < ARTICLE_LIMITS.minPublishWords) issues.push("CONTENT_SHORT");
  if (countWords(values.content) >= ARTICLE_LIMITS.minPublishWords && !parseContent(values.content).some((block) => block.type === "heading"))
    issues.push("NO_HEADING");
  const excerptLength = values.excerpt.trim().length;
  if (excerptLength > 0 && (excerptLength < ARTICLE_LIMITS.excerptIdealMin || excerptLength > ARTICLE_LIMITS.excerptIdealMax)) issues.push("EXCERPT_LENGTH");
  if (!values.titleEn.trim() || !values.contentEn.trim()) issues.push("NO_ENGLISH");
  return issues;
}
