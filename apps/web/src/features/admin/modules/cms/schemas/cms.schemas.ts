import { z } from "zod";
import { ARTICLE_LIMITS, ARTICLE_SLUG_REGEX, FAQ_LIMITS } from "../utils/cmsRules";

const optionalText = (max: number) => z.string().trim().max(max, "TEXT_TOO_LONG");

export const articleFormSchema = z.object({
  title: z.string().trim().min(1, "ARTICLE_TITLE_REQUIRED").max(ARTICLE_LIMITS.title, "TEXT_TOO_LONG"),
  titleEn: optionalText(ARTICLE_LIMITS.title),
  slug: z.string().trim().regex(ARTICLE_SLUG_REGEX, "ARTICLE_SLUG_INVALID").max(ARTICLE_LIMITS.slug, "ARTICLE_SLUG_INVALID"),
  excerpt: optionalText(ARTICLE_LIMITS.excerpt),
  excerptEn: optionalText(ARTICLE_LIMITS.excerpt),
  content: optionalText(ARTICLE_LIMITS.content),
  contentEn: optionalText(ARTICLE_LIMITS.content),
  thumbnail: z.url("INVALID_URL").max(500).nullable(),
  isPublished: z.boolean(),
});

export const createArticleSchema = articleFormSchema;
export const updateArticleSchema = z.object({ articleId: z.uuid(), values: articleFormSchema });
export const articleIdSchema = z.object({ articleId: z.uuid() });
export const toggleArticlePublishSchema = z.object({ articleId: z.uuid(), isPublished: z.boolean() });

export const faqFormSchema = z.object({
  question: z.string().trim().min(1, "FAQ_QUESTION_REQUIRED").max(FAQ_LIMITS.question, "TEXT_TOO_LONG"),
  questionEn: optionalText(FAQ_LIMITS.question),
  answer: z.string().trim().min(1, "FAQ_ANSWER_REQUIRED").max(FAQ_LIMITS.answer, "TEXT_TOO_LONG"),
  answerEn: optionalText(FAQ_LIMITS.answer),
  // Mã chủ đề — action kiểm tra lại với danh sách chủ đề của storefront
  category: z.string().trim().min(1, "FAQ_TOPIC_REQUIRED").max(40),
  isActive: z.boolean(),
});

export const createFaqSchema = faqFormSchema;
export const updateFaqSchema = z.object({ faqId: z.uuid(), values: faqFormSchema });
export const faqIdSchema = z.object({ faqId: z.uuid() });
export const toggleFaqActiveSchema = z.object({ faqId: z.uuid(), isActive: z.boolean() });
/** Thứ tự mới của các câu trong MỘT chủ đề (id theo thứ tự hiển thị) */
export const reorderFaqsSchema = z.object({ category: z.string().trim().min(1).max(40), ids: z.array(z.uuid()).min(1).max(200) });
