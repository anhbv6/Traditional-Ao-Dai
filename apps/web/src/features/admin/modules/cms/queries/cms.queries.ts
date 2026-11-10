import { prisma } from "../../../core/server/db.server";
import { type AdminArticle, type AdminArticleRow, type AdminFaq, type ArticleEditorData, type CmsBoardData } from "../types/cms.types";
import { countWords } from "../utils/cmsRules";

type ArticleRecord = Awaited<ReturnType<typeof findArticles>>[number];

const findArticles = (where: { id?: string } = {}) =>
  prisma.article.findMany({
    where,
    include: { author: { select: { name: true, email: true } } },
    orderBy: [{ isPublished: "asc" }, { updatedAt: "desc" }],
  });

function toArticleRow(article: ArticleRecord): AdminArticleRow {
  return {
    id: article.id,
    title: article.title,
    titleEn: article.titleEn,
    slug: article.slug,
    excerpt: article.excerpt,
    thumbnail: article.thumbnail,
    isPublished: article.isPublished,
    authorName: article.author?.name || article.author?.email || null,
    words: countWords(article.content),
    hasEnglish: Boolean(article.titleEn?.trim() && article.contentEn?.trim()),
    createdAt: article.createdAt.toISOString(),
    updatedAt: article.updatedAt.toISOString(),
  };
}

export function toAdminFaq(faq: Awaited<ReturnType<typeof prisma.faq.findMany>>[number]): AdminFaq {
  return {
    id: faq.id,
    question: faq.question,
    questionEn: faq.questionEn,
    answer: faq.answer,
    answerEn: faq.answerEn,
    category: faq.category,
    order: faq.order,
    isActive: faq.isActive,
    updatedAt: faq.updatedAt.toISOString(),
  };
}

/** Màn Nội dung & FAQs: mọi bài viết (nháp lên trước, mới sửa lên trước) + mọi câu hỏi theo chủ đề và thứ tự */
export async function getCmsBoardQuery(): Promise<CmsBoardData> {
  const [articles, faqs] = await Promise.all([findArticles(), prisma.faq.findMany({ orderBy: [{ category: "asc" }, { order: "asc" }, { createdAt: "asc" }] })]);
  return { articles: articles.map(toArticleRow), faqs: faqs.map(toAdminFaq) };
}

/** Màn soạn bài: bài đầy đủ (null khi viết mới) + slug đã dùng để báo trùng */
export async function getArticleEditorQuery(articleId: string | null): Promise<ArticleEditorData | null> {
  const [found, slugs] = await Promise.all([
    articleId ? findArticles({ id: articleId }) : Promise.resolve([]),
    prisma.article.findMany({ where: articleId ? { id: { not: articleId } } : {}, select: { slug: true } }),
  ]);
  const record = found[0];
  if (articleId && !record) return null;
  const article: AdminArticle | null = record
    ? { ...toArticleRow(record), excerptEn: record.excerptEn, content: record.content, contentEn: record.contentEn }
    : null;
  return { article, takenSlugs: slugs.map((item) => item.slug) };
}
