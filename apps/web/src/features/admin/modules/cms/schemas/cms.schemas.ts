import { z } from "zod";

export const toggleArticlePublishSchema = z.object({ articleId: z.uuid(), isPublished: z.boolean() });
export const toggleFaqActiveSchema = z.object({ faqId: z.uuid(), isActive: z.boolean() });
