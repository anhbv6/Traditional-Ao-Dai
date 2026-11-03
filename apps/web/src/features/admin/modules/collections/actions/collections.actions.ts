"use server";

import { type z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { recordAudit } from "../../../core/server/audit.server";
import { ADMIN_MODULE_ACCESS } from "../../../core/session/permissions";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { toSlug } from "@/features/admin/modules/products";
import {
  getAdminCollectionItemQuery,
  getCollectionProductStatesQuery,
  getCollectionStatusImpactQuery,
} from "../queries/collections.queries";
import {
  changeCollectionStatusSchema,
  collectionIdSchema,
  createCollectionSchema,
  saveCollectionSchema,
  setCollectionHomepageSchema,
} from "../schemas/collections.schemas";
import {
  fromDateInputValue,
  getTransitionBlockers,
  HOMEPAGE_COLLECTION_LIMIT,
  isPublicStatus,
} from "../utils/collectionLifecycle";

const ACCESS = ADMIN_MODULE_ACCESS.collections;

function revalidateCollections(collectionId?: string) {
  revalidatePath("/admin/catalog/collections");
  if (collectionId) revalidatePath(`/admin/catalog/collections/${collectionId}`);
}

function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

/** Slug duy nhất từ tên: thêm hậu tố -2, -3... nếu đã có (bỏ qua chính bộ sưu tập đang sửa) */
async function resolveUniqueSlug(base: string, excludeId?: string) {
  const root = base || "bo-suu-tap";
  const existing = await prisma.collection.findMany({
    where: { slug: { startsWith: root }, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { slug: true },
  });
  const taken = new Set(existing.map((c) => c.slug));

  let slug = root;
  for (let suffix = 2; taken.has(slug); suffix += 1) slug = `${root}-${suffix}`;
  return slug;
}

/** Trang chủ còn chỗ không — chỉ tính bộ sưu tập chưa lưu trữ đang bật hiện trang chủ */
async function isHomepageFull(excludeId: string) {
  const count = await prisma.collection.count({
    where: { showOnHomepage: true, status: { not: "ARCHIVED" }, deletedAt: null, id: { not: excludeId } },
  });
  return count >= HOMEPAGE_COLLECTION_LIMIT;
}

/**
 * Server Action: tạo bộ sưu tập nháp (chỉ cần tên + mã), sau đó soạn chi tiết ở trình soạn
 */
export async function createCollectionAction(raw: z.input<typeof createCollectionSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(createCollectionSchema, raw);
  if (!input.success) return input;
  const { name, code } = input.data;

  try {
    if (await prisma.collection.findUnique({ where: { code }, select: { id: true } })) {
      return { success: false as const, error: "COLLECTION_CODE_DUPLICATE" };
    }

    const slug = await resolveUniqueSlug(toSlug(name));
    const created = await prisma.collection.create({ data: { name, code, slug }, select: { id: true } });

    await recordAudit({
      actorId: auth.user.id,
      action: "COLLECTION_CREATED",
      targetType: "COLLECTION",
      targetId: created.id,
      metadata: { name, code },
    });
    revalidateCollections();

    return { success: true as const, data: { id: created.id } };
  } catch (error) {
    if (isUniqueViolation(error)) return { success: false as const, error: "COLLECTION_CODE_DUPLICATE" };
    console.error("Lỗi createCollectionAction:", error);
    return { success: false as const, error: "COLLECTION_CREATE_FAILED" };
  }
}

/**
 * Server Action: lưu nội dung, hình ảnh, hiển thị, SEO và danh sách sản phẩm (thứ tự + nổi bật) trong một giao dịch.
 * Trạng thái vòng đời đổi riêng ở changeCollectionStatusAction để luôn qua bước kiểm tra & xác nhận.
 */
export async function saveCollectionAction(raw: z.input<typeof saveCollectionSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(saveCollectionSchema, raw);
  if (!input.success) return input;
  const { collectionId, products, ...values } = input.data;

  try {
    const existing = await prisma.collection.findFirst({
      where: { id: collectionId, deletedAt: null },
      select: {
        status: true,
        code: true,
        slug: true,
        publishedAt: true,
        showOnHomepage: true,
        _count: { select: { products: true } },
      },
    });
    if (!existing) return { success: false as const, error: "COLLECTION_NOT_FOUND" };

    // Đã công bố: mã nằm trong SKU, slug đã có trên quảng cáo / Google → không đổi nữa
    if (existing.publishedAt && (values.code !== existing.code || values.slug !== existing.slug)) {
      return { success: false as const, error: "COLLECTION_CODE_LOCKED" };
    }
    // Bộ sưu tập đang công khai phải giữ đủ điều kiện đã kiểm tra lúc công bố
    if (isPublicStatus(existing.status) && !values.coverImage) {
      return { success: false as const, error: "COLLECTION_COVER_REQUIRED" };
    }
    if (existing.status === "COMING_SOON" && !values.launchAt) {
      return { success: false as const, error: "COLLECTION_LAUNCH_DATE_REQUIRED" };
    }
    if (existing.status === "ACTIVE" && products.length === 0) {
      return { success: false as const, error: "COLLECTION_PRODUCTS_REQUIRED" };
    }

    // Bộ sưu tập lưu trữ không hiện trang chủ; bật mới thì phải còn chỗ
    const showOnHomepage = existing.status === "ARCHIVED" ? false : values.showOnHomepage;
    if (showOnHomepage && !existing.showOnHomepage && (await isHomepageFull(collectionId))) {
      return { success: false as const, error: "COLLECTION_HOMEPAGE_LIMIT" };
    }

    const productIds = products.map((p) => p.productId);
    const found = await prisma.product.count({ where: { id: { in: productIds } } });
    if (found !== productIds.length) return { success: false as const, error: "COLLECTION_PRODUCT_INVALID" };

    if (values.code !== existing.code) {
      const taken = await prisma.collection.findFirst({ where: { code: values.code, id: { not: collectionId } } });
      if (taken) return { success: false as const, error: "COLLECTION_CODE_DUPLICATE" };
    }
    const slug = values.slug === existing.slug ? existing.slug : await resolveUniqueSlug(values.slug, collectionId);

    await prisma.$transaction(async (tx) => {
      await tx.collection.update({
        where: { id: collectionId },
        data: {
          name: values.name,
          nameEn: values.nameEn || null,
          code: values.code,
          slug,
          tagline: values.tagline || null,
          taglineEn: values.taglineEn || null,
          season: values.season || null,
          seasonEn: values.seasonEn || null,
          description: values.description || null,
          descriptionEn: values.descriptionEn || null,
          story: values.story || null,
          storyEn: values.storyEn || null,
          coverImage: values.coverImage || null,
          coverImageMobile: values.coverImageMobile || null,
          bannerImage: values.bannerImage || null,
          bannerImageMobile: values.bannerImageMobile || null,
          gallery: values.gallery,
          accentColor: values.accentColor || null,
          autoPushOosToBottom: values.autoPushOosToBottom,
          launchAt: fromDateInputValue(values.launchAt),
          endAt: fromDateInputValue(values.endAt),
          showOnHomepage,
          homepageOrder: values.homepageOrder,
          showInLookbook: values.showInLookbook,
          seoTitle: values.seoTitle || null,
          seoTitleEn: values.seoTitleEn || null,
          seoDescription: values.seoDescription || null,
          seoDescriptionEn: values.seoDescriptionEn || null,
        },
      });

      // Thay toàn bộ danh sách: gỡ sản phẩm bị bỏ, cập nhật thứ tự / nổi bật cho phần còn lại
      await tx.collectionProduct.deleteMany({ where: { collectionId, productId: { notIn: productIds } } });
      for (const [position, item] of products.entries()) {
        await tx.collectionProduct.upsert({
          where: { collectionId_productId: { collectionId, productId: item.productId } },
          create: { collectionId, productId: item.productId, position, isHighlighted: item.isHighlighted },
          update: { position, isHighlighted: item.isHighlighted },
        });
      }
    });

    await recordAudit({
      actorId: auth.user.id,
      action: "COLLECTION_UPDATED",
      targetType: "COLLECTION",
      targetId: collectionId,
      metadata: { productCount: { before: existing._count.products, after: products.length }, showOnHomepage },
    });
    revalidateCollections(collectionId);

    return { success: true as const, data: { slug } };
  } catch (error) {
    if (isUniqueViolation(error)) return { success: false as const, error: "COLLECTION_CODE_DUPLICATE" };
    console.error("Lỗi saveCollectionAction:", error);
    return { success: false as const, error: "COLLECTION_UPDATE_FAILED" };
  }
}

/**
 * Server Action: ảnh hưởng tới sản phẩm trước khi đổi trạng thái (hộp xác nhận hiển thị số liệu này)
 */
export async function getCollectionStatusImpactAction(collectionId: string) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(collectionIdSchema, { collectionId });
  if (!input.success) return input;

  try {
    return { success: true as const, data: await getCollectionStatusImpactQuery(collectionId) };
  } catch (error) {
    console.error("Lỗi getCollectionStatusImpactAction:", error);
    return { success: false as const, error: "COLLECTION_UPDATE_FAILED" };
  }
}

/**
 * Server Action: chuyển trạng thái vòng đời và xử lý sản phẩm đi kèm.
 * - Mở bán: có thể bật bán sản phẩm đang ẩn nhưng đủ điều kiện (chưa đủ thì bỏ qua, báo số lượng).
 * - Sắp ra mắt / lưu trữ: có thể ẩn sản phẩm chỉ còn bán qua bộ sưu tập này; sản phẩm còn thuộc
 *   một bộ sưu tập ĐANG MỞ BÁN khác vẫn giữ nguyên để không cắt ngang việc bán ở mùa kia.
 */
export async function changeCollectionStatusAction(raw: z.input<typeof changeCollectionStatusSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(changeCollectionStatusSchema, raw);
  if (!input.success) return input;
  const { collectionId, status, activateReadyProducts, hideExclusiveProducts } = input.data;

  try {
    const existing = await prisma.collection.findFirst({
      where: { id: collectionId, deletedAt: null },
      select: {
        status: true,
        coverImage: true,
        launchAt: true,
        publishedAt: true,
        _count: { select: { products: true } },
      },
    });
    if (!existing) return { success: false as const, error: "COLLECTION_NOT_FOUND" };

    const blockers = getTransitionBlockers({ ...existing, productCount: existing._count.products }, status);
    if (blockers.length > 0) return { success: false as const, error: blockers[0] };

    const states = await getCollectionProductStatesQuery(collectionId);
    const toActivate =
      status === "ACTIVE" && activateReadyProducts
        ? states.filter((s) => !s.isActive && s.isReady).map((s) => s.id)
        : [];
    const skipped =
      status === "ACTIVE" && activateReadyProducts ? states.filter((s) => !s.isActive && !s.isReady).length : 0;
    const toHide =
      (status === "COMING_SOON" || status === "ARCHIVED") && hideExclusiveProducts
        ? states.filter((s) => s.isActive && !s.hasOtherActiveCollection).map((s) => s.id)
        : [];

    const now = new Date();
    await prisma.$transaction(async (tx) => {
      await tx.collection.update({
        where: { id: collectionId },
        data: {
          status,
          publishedAt: existing.publishedAt ?? (isPublicStatus(status) ? now : null),
          archivedAt: status === "ARCHIVED" ? now : null,
          // Hết mùa thì rời trang chủ, nhường chỗ cho mùa đang bán
          ...(status === "ARCHIVED" ? { showOnHomepage: false } : {}),
        },
      });
      if (toActivate.length > 0) {
        await tx.product.updateMany({ where: { id: { in: toActivate } }, data: { isActive: true } });
      }
      if (toHide.length > 0) {
        await tx.product.updateMany({ where: { id: { in: toHide } }, data: { isActive: false } });
      }
    });

    await recordAudit({
      actorId: auth.user.id,
      action: "COLLECTION_STATUS_CHANGED",
      targetType: "COLLECTION",
      targetId: collectionId,
      metadata: {
        from: existing.status,
        to: status,
        activatedProductIds: toActivate,
        hiddenProductIds: toHide,
        skipped,
      },
    });
    revalidateCollections(collectionId);
    if (toActivate.length > 0 || toHide.length > 0) revalidatePath("/admin/products");

    return {
      success: true as const,
      data: {
        collection: await getAdminCollectionItemQuery(collectionId),
        activated: toActivate.length,
        hidden: toHide.length,
        skipped,
      },
    };
  } catch (error) {
    console.error("Lỗi changeCollectionStatusAction:", error);
    return { success: false as const, error: "COLLECTION_UPDATE_FAILED" };
  }
}

/**
 * Server Action: bật/tắt hiện ở trang chủ ngay từ thẻ bộ sưu tập
 */
export async function setCollectionHomepageAction(raw: z.input<typeof setCollectionHomepageSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(setCollectionHomepageSchema, raw);
  if (!input.success) return input;
  const { collectionId, showOnHomepage } = input.data;

  try {
    const existing = await prisma.collection.findFirst({
      where: { id: collectionId, deletedAt: null },
      select: { status: true },
    });
    if (!existing) return { success: false as const, error: "COLLECTION_NOT_FOUND" };
    if (showOnHomepage && existing.status === "ARCHIVED")
      return { success: false as const, error: "COLLECTION_TRANSITION_INVALID" };
    if (showOnHomepage && (await isHomepageFull(collectionId)))
      return { success: false as const, error: "COLLECTION_HOMEPAGE_LIMIT" };

    await prisma.collection.update({ where: { id: collectionId }, data: { showOnHomepage } });
    await recordAudit({
      actorId: auth.user.id,
      action: "COLLECTION_HOMEPAGE_UPDATED",
      targetType: "COLLECTION",
      targetId: collectionId,
      metadata: { showOnHomepage },
    });
    revalidateCollections(collectionId);

    return { success: true as const, data: { showOnHomepage } };
  } catch (error) {
    console.error("Lỗi setCollectionHomepageAction:", error);
    return { success: false as const, error: "COLLECTION_UPDATE_FAILED" };
  }
}

/**
 * Server Action: xóa mềm bộ sưu tập CHƯA TỪNG công bố. Đã công bố thì chỉ lưu trữ (giữ link, lookbook, lịch sử SEO).
 * Bản ghi và liên kết sản phẩm vẫn giữ để tra cứu / khôi phục; mã và slug được gắn hậu tố để nhả khóa unique,
 * nhờ vậy tạo lại bộ sưu tập cùng mã vẫn được (giá trị gốc nằm trong AuditLog).
 */
export async function deleteCollectionAction(collectionId: string) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(collectionIdSchema, { collectionId });
  if (!input.success) return input;

  try {
    const existing = await prisma.collection.findFirst({
      where: { id: collectionId, deletedAt: null },
      select: { name: true, code: true, slug: true, publishedAt: true },
    });
    if (!existing) return { success: false as const, error: "COLLECTION_NOT_FOUND" };
    if (existing.publishedAt) return { success: false as const, error: "COLLECTION_DELETE_PUBLISHED" };

    const now = new Date();
    const suffix = now.getTime().toString(36);
    await prisma.collection.update({
      where: { id: collectionId },
      data: {
        deletedAt: now,
        code: `${existing.code}~DEL-${suffix}`,
        slug: `${existing.slug}-deleted-${suffix}`,
        showOnHomepage: false,
      },
    });
    await recordAudit({
      actorId: auth.user.id,
      action: "COLLECTION_DELETED",
      targetType: "COLLECTION",
      targetId: collectionId,
      metadata: { name: existing.name, code: existing.code, slug: existing.slug, soft: true },
    });
    revalidateCollections();

    return { success: true as const, data: { id: collectionId } };
  } catch (error) {
    console.error("Lỗi deleteCollectionAction:", error);
    return { success: false as const, error: "COLLECTION_DELETE_FAILED" };
  }
}
