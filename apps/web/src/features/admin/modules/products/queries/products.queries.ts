import { type Prisma } from "@repo/db";
import { toVnd } from "@repo/shared";
import { prisma } from "../../../core/server/db.server";
import {
  type AdminProductCategory,
  type AdminProductDetail,
  type AdminProductItem,
  type AdminProductSizeChart,
} from "../types/products.types";
import { LOW_STOCK_THRESHOLD } from "../utils/products.utils";

const PRODUCT_LIST_INCLUDE = {
  category: { select: { id: true, name: true } },
  variants: { select: { id: true, stock: true } },
} satisfies Prisma.ProductInclude;

type ProductWithList = Prisma.ProductGetPayload<{ include: typeof PRODUCT_LIST_INCLUDE }>;

function toAdminProductItem(p: ProductWithList): AdminProductItem {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    material: p.material,
    basePrice: toVnd(p.basePrice),
    images: p.images,
    soldCount: p.soldCount,
    isCustomFit: p.isCustomFit,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    categoryId: p.categoryId,
    categoryName: p.category?.name ?? null,
    variantsCount: p.variants.length,
    totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
    lowStockVariants: p.variants.filter((v) => v.stock <= LOW_STOCK_THRESHOLD).length,
    createdAt: p.createdAt,
  };
}

/**
 * Query: Lấy danh sách sản phẩm Áo Dài kèm số lượng tồn kho theo biến thể
 */
export async function getAdminProductsListQuery(search?: string): Promise<AdminProductItem[]> {
  try {
    const whereCondition: Prisma.ProductWhereInput = {};
    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { material: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereCondition,
      include: PRODUCT_LIST_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return products.map(toAdminProductItem);
  } catch (error) {
    console.error("Lỗi khi query danh sách sản phẩm Admin:", error);
    return [];
  }
}

/** Query: Một dòng danh sách — dùng cập nhật bảng ngay sau khi thêm/sửa */
export async function getAdminProductItemQuery(productId: string): Promise<AdminProductItem | null> {
  const product = await prisma.product.findUnique({ where: { id: productId }, include: PRODUCT_LIST_INCLUDE });
  return product ? toAdminProductItem(product) : null;
}

interface ChartRef {
  id: string;
  name: string;
}

/** Bảng size hiệu lực: riêng của sản phẩm → của loại → của nhóm gốc (khi loại con cùng nhóm hàng với gốc) */
function resolveEffectiveSizeChart(product: {
  sizeChart: ChartRef | null;
  category: { group: string; defaultSizeChart: ChartRef | null; parent: { group: string; defaultSizeChart: ChartRef | null } | null };
}) {
  if (product.sizeChart) return { ...product.sizeChart, inherited: false };
  const { category } = product;
  const inherited =
    category.defaultSizeChart ?? (category.parent?.group === category.group ? category.parent.defaultSizeChart : null);
  return inherited ? { ...inherited, inherited: true } : null;
}

/** Query: Chi tiết sản phẩm kèm toàn bộ SKU cho dialog xem/sửa */
export async function getAdminProductDetailQuery(productId: string): Promise<AdminProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      category: {
        select: {
          id: true,
          name: true,
          group: true,
          defaultSizeChart: { select: { id: true, name: true } },
          parent: { select: { group: true, defaultSizeChart: { select: { id: true, name: true } } } },
        },
      },
      sizeChart: { select: { id: true, name: true } },
      variants: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!product) return null;

  return {
    ...toAdminProductItem(product),
    nameEn: product.nameEn,
    materialEn: product.materialEn,
    description: product.description,
    descriptionEn: product.descriptionEn,
    sizeChartId: product.sizeChartId,
    effectiveSizeChart: resolveEffectiveSizeChart(product),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      price: v.price === null ? null : toVnd(v.price),
      stock: v.stock,
    })),
  };
}

/** Query: Loại sản phẩm cho ô chọn trong form sản phẩm — theo thứ tự cây, kèm nhóm hàng và bảng size thừa hưởng */
export async function getAdminProductCategoriesQuery(): Promise<AdminProductCategory[]> {
  try {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, group: true, parentId: true, position: true, defaultSizeChartId: true },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    });
    const roots = categories.filter((c) => c.parentId === null);
    return roots.flatMap((root) => [
      { id: root.id, name: root.name, label: root.name, group: root.group, defaultSizeChartId: root.defaultSizeChartId },
      ...categories
        .filter((c) => c.parentId === root.id)
        .map((child) => ({
          id: child.id,
          name: child.name,
          label: `${root.name} › ${child.name}`,
          group: child.group,
          defaultSizeChartId: child.defaultSizeChartId ?? (child.group === root.group ? root.defaultSizeChartId : null),
        })),
    ]);
  } catch (error) {
    console.error("Lỗi khi query danh mục sản phẩm Admin:", error);
    return [];
  }
}

/** Query: Bảng size để gắn riêng cho sản phẩm và gợi ý ký hiệu size khi nhập SKU */
export async function getAdminProductSizeChartsQuery(): Promise<AdminProductSizeChart[]> {
  try {
    const charts = await prisma.sizeChart.findMany({
      select: {
        id: true,
        name: true,
        group: true,
        isActive: true,
        rows: { select: { sizeLabel: true }, orderBy: { position: "asc" } },
      },
      orderBy: { name: "asc" },
    });
    return charts.map(({ rows, ...chart }) => ({ ...chart, sizeLabels: rows.map((row) => row.sizeLabel) }));
  } catch (error) {
    console.error("Lỗi khi query bảng size cho sản phẩm:", error);
    return [];
  }
}
