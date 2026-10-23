"use server";

import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { revalidatePath } from "next/cache";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { toggleArticlePublishSchema, toggleFaqActiveSchema } from "../schemas/cms.schemas";

/**
 * Server Action: Bật/Tắt xuất bản bài viết
 */
export async function toggleArticlePublishAction(articleId: string, isPublished: boolean) {
  const auth = await authorizeAdminAction({ permission: "MANAGE_CONTENT" });
  if (!auth.success) return auth;

  const input = parseActionInput(toggleArticlePublishSchema, { articleId, isPublished });
  if (!input.success) return input;

  try {
    const updated = await prisma.article.update({
      where: { id: articleId },
      data: { isPublished },
    });

    revalidatePath("/admin/cms");

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Lỗi toggleArticlePublishAction:", error);
    return {
      success: false,
      error: "ARTICLE_UPDATE_FAILED",
    };
  }
}

/**
 * Server Action: Bật/Tắt kích hoạt câu hỏi FAQ
 */
export async function toggleFaqActiveAction(faqId: string, isActive: boolean) {
  const auth = await authorizeAdminAction({ permission: "MANAGE_CONTENT" });
  if (!auth.success) return auth;

  const input = parseActionInput(toggleFaqActiveSchema, { faqId, isActive });
  if (!input.success) return input;

  try {
    const updated = await prisma.faq.update({
      where: { id: faqId },
      data: { isActive },
    });

    revalidatePath("/admin/cms");

    return {
      success: true,
      data: updated,
    };
  } catch (error) {
    console.error("Lỗi toggleFaqActiveAction:", error);
    return {
      success: false,
      error: "FAQ_UPDATE_FAILED",
    };
  }
}
