import { type Prisma } from "@repo/db";
import { toVnd } from "@repo/shared";
import { prisma } from "../../../core/server/db.server";
import { isProductReadyToActivate } from "@/features/admin/modules/products";
import {
  type AdminCollectionDetail,
  type AdminCollectionItem,
  type CollectionPickerProduct,
  type CollectionStatusImpact,
} from "../types/collections.types";

const COLLECTION_LIST_INCLUDE = {
  _count: {
    select: {
      products: true,
    },
  },
  products: { select: { product: { select: { isActive: true } } } },
} satisfies Prisma.CollectionInclude;

type CollectionWithCounts = Prisma.CollectionGetPayload<{ include: typeof COLLECTION_LIST_INCLUDE }>;

const toIso = (value: Date | null) => (value ? value.toISOString() : null);

function toAdminCollectionItem(c: CollectionWithCounts): AdminCollectionItem {
  return {
    id: c.id,
    code: c.code,
    slug: c.slug,
    name: c.name,
    tagline: c.tagline,
    season: c.season,
    coverImage: c.coverImage,
    bannerImage: c.bannerImage,
    accentColor: c.accentColor,
    status: c.status,
    launchAt: toIso(c.launchAt),
    endAt: toIso(c.endAt),
    publishedAt: toIso(c.publishedAt),
    archivedAt: toIso(c.archivedAt),
    showOnHomepage: c.showOnHomepage,
    homepageOrder: c.homepageOrder,
    showInLookbook: c.showInLookbook,
    productCount: c._count.products,
    sellingCount: c.products.filter((p) => p.product.isActive).length,
    updatedAt: c.updatedAt.toISOString(),
  };
}

/** Query: danh sách bộ sưu tập kèm số sản phẩm và số sản phẩm đang bán */
export async function getAdminCollectionsQuery(): Promise<AdminCollectionItem[]> {
  try {
    const collections = await prisma.collection.findMany({
      where: { deletedAt: null },
      include: COLLECTION_LIST_INCLUDE,
      orderBy: [{ updatedAt: "desc" }],
    });
    return collections.map(toAdminCollectionItem);
  } catch (error) {
    console.error("Lỗi khi query danh sách bộ sưu tập:", error);
    return [];
  }
}

/** Query: một dòng danh sách — cập nhật thẻ ngay sau khi đổi trạng thái */
export async function getAdminCollectionItemQuery(collectionId: string): Promise<AdminCollectionItem | null> {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, deletedAt: null },
    include: COLLECTION_LIST_INCLUDE,
  });
  return collection ? toAdminCollectionItem(collection) : null;
}

/** Query: chi tiết cho trình soạn bộ sưu tập (sản phẩm theo thứ tự hiển thị) */
export async function getAdminCollectionDetailQuery(collectionId: string): Promise<AdminCollectionDetail | null> {
  const collection = await prisma.collection.findFirst({
    where: { id: collectionId, deletedAt: null },
    include: {
      ...COLLECTION_LIST_INCLUDE,
      products: {
        orderBy: { position: "asc" },
        select: { productId: true, isHighlighted: true, product: { select: { isActive: true } } },
      },
    },
  });
  if (!collection) return null;

  return {
    ...toAdminCollectionItem(collection),
    nameEn: collection.nameEn,
    taglineEn: collection.taglineEn,
    description: collection.description,
    descriptionEn: collection.descriptionEn,
    story: collection.story,
    storyEn: collection.storyEn,
    seasonEn: collection.seasonEn,
    coverImageMobile: collection.coverImageMobile,
    bannerImageMobile: collection.bannerImageMobile,
    gallery: collection.gallery,
    autoPushOosToBottom: collection.autoPushOosToBottom,
    seoTitle: collection.seoTitle,
    seoTitleEn: collection.seoTitleEn,
    seoDescription: collection.seoDescription,
    seoDescriptionEn: collection.seoDescriptionEn,
    products: collection.products.map((p) => ({ productId: p.productId, isHighlighted: p.isHighlighted })),
  };
}

/** Query: toàn bộ sản phẩm để chọn vào bộ sưu tập, kèm các bộ sưu tập mỗi sản phẩm đang thuộc */
export async function getCollectionPickerProductsQuery(): Promise<CollectionPickerProduct[]> {
  try {
    const products = await prisma.product.findMany({
      select: {
        id: true,
        name: true,
        nameEn: true,
        images: true,
        basePrice: true,
        isActive: true,
        category: { select: { name: true } },
        variants: { select: { size: true, color: true, stock: true } },
        collections: {
          where: { collection: { deletedAt: null } },
          select: { collection: { select: { id: true, name: true, status: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    return products.map((p) => {
      const basePrice = toVnd(p.basePrice);
      return {
        id: p.id,
        name: p.name,
        nameEn: p.nameEn,
        image: p.images[0] ?? null,
        basePrice,
        categoryName: p.category?.name ?? null,
        isActive: p.isActive,
        isReady: isProductReadyToActivate({ images: p.images, basePrice, variants: p.variants }),
        totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
        collections: p.collections.map((c) => c.collection),
      };
    });
  } catch (error) {
    console.error("Lỗi khi query sản phẩm cho bộ sưu tập:", error);
    return [];
  }
}

/**
 * Query: sản phẩm của bộ sưu tập kèm các bộ sưu tập khác — nền cho mọi tính toán ảnh hưởng khi đổi trạng thái.
 * "Độc quyền" = đang bán nhưng KHÔNG thuộc bộ sưu tập ĐANG MỞ BÁN nào khác (ẩn đi thì không còn chỗ bán).
 */
export async function getCollectionProductStatesQuery(collectionId: string) {
  const links = await prisma.collectionProduct.findMany({
    where: { collectionId },
    select: {
      product: {
        select: {
          id: true,
          isActive: true,
          images: true,
          basePrice: true,
          variants: { select: { size: true, color: true } },
          collections: {
            where: { collectionId: { not: collectionId }, collection: { status: "ACTIVE", deletedAt: null } },
            select: { collectionId: true },
          },
        },
      },
    },
  });

  return links.map(({ product }) => ({
    id: product.id,
    isActive: product.isActive,
    isReady: isProductReadyToActivate({
      images: product.images,
      basePrice: toVnd(product.basePrice),
      variants: product.variants,
    }),
    hasOtherActiveCollection: product.collections.length > 0,
  }));
}

/** Query: số bộ sưu tập khác (chưa lưu trữ, chưa xóa) đang chiếm chỗ trên trang chủ */
export async function getHomepageCollectionUsageQuery(excludeId: string): Promise<number> {
  return prisma.collection.count({
    where: { showOnHomepage: true, status: { not: "ARCHIVED" }, deletedAt: null, id: { not: excludeId } },
  });
}

/** Query: ảnh hưởng tới sản phẩm nếu đổi trạng thái bộ sưu tập */
export async function getCollectionStatusImpactQuery(collectionId: string): Promise<CollectionStatusImpact> {
  const states = await getCollectionProductStatesQuery(collectionId);

  return {
    productCount: states.length,
    hiddenProducts: states.filter((s) => !s.isActive).length,
    readyHiddenProducts: states.filter((s) => !s.isActive && s.isReady).length,
    exclusiveActiveProducts: states.filter((s) => s.isActive && !s.hasOtherActiveCollection).length,
    sharedActiveProducts: states.filter((s) => s.isActive && s.hasOtherActiveCollection).length,
  };
}
