"use server";

import { revalidatePath } from "next/cache";
import { type z } from "zod";
import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { recordAudit } from "../../../core/server/audit.server";
import { ADMIN_MODULE_ACCESS } from "../../../core/session/permissions";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { toAdminFaq } from "../queries/cms.queries";
import {
  articleIdSchema,
  createArticleSchema,
  createFaqSchema,
  faqIdSchema,
  reorderFaqsSchema,
  toggleArticlePublishSchema,
  toggleFaqActiveSchema,
  updateArticleSchema,
  updateFaqSchema,
} from "../schemas/cms.schemas";
import { ARTICLE_ISSUE_LEVEL, articleIssues, isFaqTopic } from "../utils/cmsRules";

const ACCESS = ADMIN_MODULE_ACCESS.cms;

function revalidateCms(articleId?: string) {
  revalidatePath("/admin/cms");
  if (articleId) revalidatePath(`/admin/cms/articles/${articleId}`);
}

type ArticleValues = z.output<typeof createArticleSchema>;

/** Bài đăng phải đủ tiêu đề, slug, mô tả, ảnh bìa, thân bài đủ dài — kiểm tra bằng đúng `articleIssues` của màn soạn */
const canPublish = (values: ArticleValues) =>
  !articleIssues({ ...values, titleEn: values.titleEn, contentEn: values.contentEn }).some((issue) => ARTICLE_ISSUE_LEVEL[issue] === "block");

const articleData = (values: ArticleValues) => ({
  title: values.title,
  titleEn: values.titleEn || null,
  slug: values.slug,
  excerpt: values.excerpt || null,
  excerptEn: values.excerptEn || null,
  content: values.content,
  contentEn: values.contentEn || null,
  thumbnail: values.thumbnail,
  isPublished: values.isPublished,
});

// ─── Bài viết ────────────────────────────────────────────────────────────────

/** Server Action: viết bài mới — tác giả là người đang đăng nhập */
export async function createArticleAction(raw: z.input<typeof createArticleSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(createArticleSchema, raw);
  if (!input.success) return input;

  try {
    if (input.data.isPublished && !canPublish(input.data)) return { success: false as const, error: "ARTICLE_PUBLISH_INCOMPLETE" };
    if (await prisma.article.findUnique({ where: { slug: input.data.slug }, select: { id: true } })) return { success: false as const, error: "ARTICLE_SLUG_TAKEN" };
    const created = await prisma.article.create({ data: { ...articleData(input.data), authorId: auth.user.id }, select: { id: true, slug: true } });
    await recordAudit({ actorId: auth.user.id, action: "ARTICLE_CREATED", targetType: "ARTICLE", targetId: created.id, metadata: { published: input.data.isPublished } });
    revalidateCms();
    return { success: true as const, data: created };
  } catch (error) {
    console.error("Lỗi createArticleAction:", error);
    return { success: false as const, error: "ARTICLE_CREATE_FAILED" };
  }
}

/** Server Action: lưu bài — đổi slug kiểm tra trùng; đăng thì phải đủ điều kiện */
export async function updateArticleAction(raw: z.input<typeof updateArticleSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(updateArticleSchema, raw);
  if (!input.success) return input;
  const { articleId, values } = input.data;

  try {
    const current = await prisma.article.findUnique({ where: { id: articleId }, select: { slug: true, isPublished: true } });
    if (!current) return { success: false as const, error: "ARTICLE_NOT_FOUND" };
    if (values.isPublished && !canPublish(values)) return { success: false as const, error: "ARTICLE_PUBLISH_INCOMPLETE" };
    if (values.slug !== current.slug && (await prisma.article.findUnique({ where: { slug: values.slug }, select: { id: true } })))
      return { success: false as const, error: "ARTICLE_SLUG_TAKEN" };
    const updated = await prisma.article.update({ where: { id: articleId }, data: articleData(values), select: { id: true, slug: true, isPublished: true, updatedAt: true } });
    await recordAudit({
      actorId: auth.user.id,
      action: current.isPublished !== values.isPublished ? (values.isPublished ? "ARTICLE_PUBLISHED" : "ARTICLE_UNPUBLISHED") : "ARTICLE_UPDATED",
      targetType: "ARTICLE",
      targetId: articleId,
      metadata: current.slug !== values.slug ? { slugBefore: current.slug, slugAfter: values.slug } : undefined,
    });
    revalidateCms(articleId);
    return { success: true as const, data: { ...updated, updatedAt: updated.updatedAt.toISOString() } };
  } catch (error) {
    console.error("Lỗi updateArticleAction:", error);
    return { success: false as const, error: "ARTICLE_UPDATE_FAILED" };
  }
}

/** Server Action: đăng / gỡ nhanh từ danh sách — đăng vẫn phải đủ điều kiện */
export async function toggleArticlePublishAction(raw: z.input<typeof toggleArticlePublishSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(toggleArticlePublishSchema, raw);
  if (!input.success) return input;

  try {
    const article = await prisma.article.findUnique({ where: { id: input.data.articleId } });
    if (!article) return { success: false as const, error: "ARTICLE_NOT_FOUND" };
    if (input.data.isPublished) {
      const values = { title: article.title, titleEn: article.titleEn ?? "", slug: article.slug, excerpt: article.excerpt ?? "", content: article.content, contentEn: article.contentEn ?? "", thumbnail: article.thumbnail };
      if (articleIssues(values).some((issue) => ARTICLE_ISSUE_LEVEL[issue] === "block")) return { success: false as const, error: "ARTICLE_PUBLISH_INCOMPLETE" };
    }
    const updated = await prisma.article.update({ where: { id: article.id }, data: { isPublished: input.data.isPublished }, select: { id: true, isPublished: true } });
    await recordAudit({ actorId: auth.user.id, action: updated.isPublished ? "ARTICLE_PUBLISHED" : "ARTICLE_UNPUBLISHED", targetType: "ARTICLE", targetId: article.id });
    revalidateCms(article.id);
    return { success: true as const, data: updated };
  } catch (error) {
    console.error("Lỗi toggleArticlePublishAction:", error);
    return { success: false as const, error: "ARTICLE_UPDATE_FAILED" };
  }
}

/** Server Action: nhân bản thành bản nháp mới (slug thêm hậu tố -ban-sao[-n]) */
export async function duplicateArticleAction(raw: z.input<typeof articleIdSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(articleIdSchema, raw);
  if (!input.success) return input;

  try {
    const source = await prisma.article.findUnique({ where: { id: input.data.articleId } });
    if (!source) return { success: false as const, error: "ARTICLE_NOT_FOUND" };
    const taken = new Set((await prisma.article.findMany({ where: { slug: { startsWith: `${source.slug}-ban-sao` } }, select: { slug: true } })).map((item) => item.slug));
    let slug = `${source.slug}-ban-sao`;
    for (let n = 2; taken.has(slug); n++) slug = `${source.slug}-ban-sao-${n}`;
    const created = await prisma.article.create({
      data: {
        title: `${source.title} (bản sao)`,
        titleEn: source.titleEn,
        slug,
        excerpt: source.excerpt,
        excerptEn: source.excerptEn,
        content: source.content,
        contentEn: source.contentEn,
        thumbnail: source.thumbnail,
        isPublished: false,
        authorId: auth.user.id,
      },
      select: { id: true },
    });
    await recordAudit({ actorId: auth.user.id, action: "ARTICLE_CREATED", targetType: "ARTICLE", targetId: created.id, metadata: { duplicatedFrom: source.id } });
    revalidateCms();
    return { success: true as const, data: created };
  } catch (error) {
    console.error("Lỗi duplicateArticleAction:", error);
    return { success: false as const, error: "ARTICLE_CREATE_FAILED" };
  }
}

/** Server Action: xóa bài — chỉ bài nháp (bài đang đăng phải gỡ trước để không làm chết liên kết đã chia sẻ) */
export async function deleteArticleAction(raw: z.input<typeof articleIdSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(articleIdSchema, raw);
  if (!input.success) return input;

  try {
    const article = await prisma.article.findUnique({ where: { id: input.data.articleId }, select: { id: true, title: true, slug: true, isPublished: true } });
    if (!article) return { success: false as const, error: "ARTICLE_NOT_FOUND" };
    if (article.isPublished) return { success: false as const, error: "ARTICLE_DELETE_PUBLISHED" };
    await prisma.article.delete({ where: { id: article.id } });
    await recordAudit({ actorId: auth.user.id, action: "ARTICLE_DELETED", targetType: "ARTICLE", targetId: article.id, metadata: { title: article.title, slug: article.slug } });
    revalidateCms();
    return { success: true as const, data: { id: article.id } };
  } catch (error) {
    console.error("Lỗi deleteArticleAction:", error);
    return { success: false as const, error: "ARTICLE_DELETE_FAILED" };
  }
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

/** Server Action: thêm câu hỏi — xếp cuối chủ đề */
export async function createFaqAction(raw: z.input<typeof createFaqSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(createFaqSchema, raw);
  if (!input.success) return input;
  const values = input.data;
  if (!isFaqTopic(values.category)) return { success: false as const, error: "FAQ_TOPIC_REQUIRED" };

  try {
    const last = await prisma.faq.aggregate({ where: { category: values.category }, _max: { order: true } });
    const created = await prisma.faq.create({
      data: {
        question: values.question,
        questionEn: values.questionEn || null,
        answer: values.answer,
        answerEn: values.answerEn || null,
        category: values.category,
        isActive: values.isActive,
        order: (last._max.order ?? -1) + 1,
      },
    });
    await recordAudit({ actorId: auth.user.id, action: "FAQ_CREATED", targetType: "FAQ", targetId: created.id });
    revalidateCms();
    return { success: true as const, data: toAdminFaq(created) };
  } catch (error) {
    console.error("Lỗi createFaqAction:", error);
    return { success: false as const, error: "FAQ_CREATE_FAILED" };
  }
}

/** Server Action: sửa câu hỏi — đổi chủ đề thì xuống cuối chủ đề mới */
export async function updateFaqAction(raw: z.input<typeof updateFaqSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(updateFaqSchema, raw);
  if (!input.success) return input;
  const { faqId, values } = input.data;
  if (!isFaqTopic(values.category)) return { success: false as const, error: "FAQ_TOPIC_REQUIRED" };

  try {
    const current = await prisma.faq.findUnique({ where: { id: faqId }, select: { category: true, order: true } });
    if (!current) return { success: false as const, error: "FAQ_NOT_FOUND" };
    const order =
      current.category === values.category
        ? current.order
        : ((await prisma.faq.aggregate({ where: { category: values.category }, _max: { order: true } }))._max.order ?? -1) + 1;
    const updated = await prisma.faq.update({
      where: { id: faqId },
      data: {
        question: values.question,
        questionEn: values.questionEn || null,
        answer: values.answer,
        answerEn: values.answerEn || null,
        category: values.category,
        isActive: values.isActive,
        order,
      },
    });
    await recordAudit({ actorId: auth.user.id, action: "FAQ_UPDATED", targetType: "FAQ", targetId: faqId });
    revalidateCms();
    return { success: true as const, data: toAdminFaq(updated) };
  } catch (error) {
    console.error("Lỗi updateFaqAction:", error);
    return { success: false as const, error: "FAQ_UPDATE_FAILED" };
  }
}

/** Server Action: hiện / ẩn câu hỏi trên trang FAQs */
export async function toggleFaqActiveAction(raw: z.input<typeof toggleFaqActiveSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(toggleFaqActiveSchema, raw);
  if (!input.success) return input;

  try {
    const updated = await prisma.faq.update({ where: { id: input.data.faqId }, data: { isActive: input.data.isActive } });
    revalidateCms();
    return { success: true as const, data: toAdminFaq(updated) };
  } catch (error) {
    console.error("Lỗi toggleFaqActiveAction:", error);
    return { success: false as const, error: "FAQ_UPDATE_FAILED" };
  }
}

/** Server Action: đổi thứ tự câu hỏi trong một chủ đề (ghi lại 0..n theo thứ tự gửi lên) */
export async function reorderFaqsAction(raw: z.input<typeof reorderFaqsSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(reorderFaqsSchema, raw);
  if (!input.success) return input;

  try {
    const inTopic = await prisma.faq.count({ where: { id: { in: input.data.ids }, category: input.data.category } });
    if (inTopic !== input.data.ids.length) return { success: false as const, error: "FAQ_REORDER_FAILED" };
    await prisma.$transaction(input.data.ids.map((id, order) => prisma.faq.update({ where: { id }, data: { order } })));
    revalidateCms();
    return { success: true as const, data: { ids: input.data.ids } };
  } catch (error) {
    console.error("Lỗi reorderFaqsAction:", error);
    return { success: false as const, error: "FAQ_REORDER_FAILED" };
  }
}

/** Server Action: xóa câu hỏi */
export async function deleteFaqAction(raw: z.input<typeof faqIdSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(faqIdSchema, raw);
  if (!input.success) return input;

  try {
    const faq = await prisma.faq.delete({ where: { id: input.data.faqId }, select: { id: true, question: true } });
    await recordAudit({ actorId: auth.user.id, action: "FAQ_DELETED", targetType: "FAQ", targetId: faq.id, metadata: { question: faq.question } });
    revalidateCms();
    return { success: true as const, data: { id: faq.id } };
  } catch (error) {
    console.error("Lỗi deleteFaqAction:", error);
    return { success: false as const, error: "FAQ_DELETE_FAILED" };
  }
}
