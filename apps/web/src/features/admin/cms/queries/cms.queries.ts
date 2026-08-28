import { prisma } from "../../server/db.server";
import { type AdminArticleItem, type AdminFaqItem } from "../types/cms.types";

/**
 * Query: Lấy danh sách bài viết & FAQs
 */
export async function getCmsArticlesAndFaqsQuery(): Promise<{
  articles: AdminArticleItem[];
  faqs: AdminFaqItem[];
}> {
  try {
    const [articles, faqs] = await Promise.all([
      prisma.article.findMany({
        include: {
          author: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.faq.findMany({
        orderBy: [{ category: "asc" }, { order: "asc" }],
      }),
    ]);

    return {
      articles: articles.map((a) => ({
        id: a.id,
        title: a.title,
        slug: a.slug,
        excerpt: a.excerpt,
        thumbnail: a.thumbnail,
        isPublished: a.isPublished,
        authorName: a.author?.name || "Admin",
        createdAt: a.createdAt,
      })),
      faqs: faqs.map((f) => ({
        id: f.id,
        question: f.question,
        answer: f.answer,
        category: f.category,
        order: f.order,
        isActive: f.isActive,
      })),
    };
  } catch (error) {
    console.error("Lỗi khi query CMS:", error);
    return { articles: [], faqs: [] };
  }
}
