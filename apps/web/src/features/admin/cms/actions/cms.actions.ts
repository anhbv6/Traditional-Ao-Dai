"use server";

import { prisma } from "../../server/db.server";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Bật/Tắt xuất bản bài viết
 */
export async function toggleArticlePublishAction(articleId: string, isPublished: boolean) {
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
  } catch (error: any) {
    console.error("Lỗi toggleArticlePublishAction:", error);
    return {
      success: false,
      error: error?.message || "Không thể cập nhật trạng thái bài viết.",
    };
  }
}

/**
 * Server Action: Bật/Tắt kích hoạt câu hỏi FAQ
 */
export async function toggleFaqActiveAction(faqId: string, isActive: boolean) {
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
  } catch (error: any) {
    console.error("Lỗi toggleFaqActiveAction:", error);
    return {
      success: false,
      error: error?.message || "Không thể cập nhật trạng thái FAQ.",
    };
  }
}
