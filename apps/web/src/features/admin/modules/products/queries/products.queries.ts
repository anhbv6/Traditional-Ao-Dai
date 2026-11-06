import { type Prisma } from "@repo/db";
import { toVnd } from "@repo/shared";
import { prisma } from "../../../core/server/db.server";
import {
  type AdminProductAttributeOption,
  type AdminProductCategory,
  type AdminProductDetail,
  type AdminProductEditorOptions,
  type AdminProductItem,
  type AdminProductMaterialOption,
  type AdminProductSizeChart,
  type ProductSetItem,
} from "../types/products.types";
import { LOW_STOCK_THRESHOLD } from "../utils/products.utils";

const PRODUCT_LIST_INCLUDE = {
  category: { select: { id: true, name: true, group: true } },
  material: { select: { name: true } },
  variants: { select: { id: true, stock: true } },
} satisfies Prisma.ProductInclude;

type ProductWithList = Prisma.ProductGetPayload<{ include: typeof PRODUCT_LIST_INCLUDE }>;

function toAdminProductItem(p: ProductWithList): AdminProductItem {
  return {
    id: p.id,
    code: p.code,
    name: p.name,
    slug: p.slug,
    saleMode: p.saleMode,
    materialName: p.material?.name ?? null,
    basePrice: toVnd(p.basePrice),
    images: p.images,
    soldCount: p.soldCount,
    isCustomFit: p.isCustomFit,
    isActive: p.isActive,
    isFeatured: p.isFeatured,
    categoryId: p.categoryId,
    categoryName: p.category.name,
    categoryGroup: p.category.group,
    variantsCount: p.variants.length,
    totalStock: p.variants.reduce((sum, v) => sum + v.stock, 0),
    lowStockVariants: p.variants.filter((v) => v.stock <= LOW_STOCK_THRESHOLD).length,
    createdAt: p.createdAt,
  };
}

/** Query: danh sách sản phẩm kèm tồn kho theo SKU */
export async function getAdminProductsListQuery(): Promise<AdminProductItem[]> {
  try {
    const products = await prisma.product.findMany({
      include: PRODUCT_LIST_INCLUDE,
      orderBy: { createdAt: "desc" },
      take: 300,
    });
    return products.map(toAdminProductItem);
  } catch (error) {
    console.error("Lỗi khi query danh sách sản phẩm Admin:", error);
    return [];
  }
}

/** Query: một dòng danh sách — cập nhật bảng sau khi đổi trạng thái */
export async function getAdminProductItemQuery(productId: string): Promise<AdminProductItem | null> {
  const product = await prisma.product.findUnique({ where: { id: productId }, include: PRODUCT_LIST_INCLUDE });
  return product ? toAdminProductItem(product) : null;
}

/** JSON món trong bộ có thể bị sửa tay ở DB — chỉ giữ phần tử đúng dạng */
function parseSetItems(value: Prisma.JsonValue): ProductSetItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const v = item as Record<string, unknown>;
    if (typeof v.label !== "string" || !v.label) return [];
    return [
      {
        label: v.label,
        labelEn: typeof v.labelEn === "string" ? v.labelEn : "",
        quantity: typeof v.quantity === "number" && v.quantity > 0 ? Math.round(v.quantity) : 1,
        materialId: typeof v.materialId === "string" ? v.materialId : null,
      },
    ];
  });
}

/** Query: chi tiết sản phẩm cho màn chi tiết */
export async function getAdminProductDetailQuery(productId: string): Promise<AdminProductDetail | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      attributes: { select: { attributeValueId: true } },
      variants: {
        orderBy: { createdAt: "asc" },
        include: { _count: { select: { orderItems: true, cartItems: true } } },
      },
    },
  });
  if (!product) return null;

  return {
    id: product.id,
    code: product.code,
    name: product.name,
    nameEn: product.nameEn,
    slug: product.slug,
    description: product.description,
    descriptionEn: product.descriptionEn,
    categoryId: product.categoryId,
    saleMode: product.saleMode,
    setItems: parseSetItems(product.setItems),
    leadTimeDays: product.leadTimeDays,
    materialId: product.materialId,
    sizeChartId: product.sizeChartId,
    basePrice: toVnd(product.basePrice),
    images: product.images,
    isActive: product.isActive,
    isCustomFit: product.isCustomFit,
    isFeatured: product.isFeatured,
    soldCount: product.soldCount,
    attributeIds: product.attributes.map((a) => a.attributeValueId),
    variants: product.variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      colorId: v.colorId,
      color: v.color,
      price: v.price === null ? null : toVnd(v.price),
      stock: v.stock,
      inUse: v._count.orderItems > 0 || v._count.cartItems > 0,
    })),
    updatedAt: product.updatedAt.toISOString(),
  };
}

/** Query: loại sản phẩm theo thứ tự cây, kèm nhóm hàng và bảng size mặc định (nhóm gốc không có bảng size) */
export async function getAdminProductCategoriesQuery(): Promise<AdminProductCategory[]> {
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
        defaultSizeChartId: child.defaultSizeChartId,
      })),
  ]);
}

/**
 * Query: dữ liệu kế thừa cho màn chi tiết sản phẩm — loại sản phẩm, bảng size, chất liệu (kèm thông số),
 * thuộc tính màu / size / đặc tính thiết kế
 */
export async function getAdminProductEditorOptionsQuery(): Promise<AdminProductEditorOptions> {
  const [categories, charts, materials, attributes, designGroups] = await Promise.all([
    getAdminProductCategoriesQuery(),
    prisma.sizeChart.findMany({
      select: {
        id: true,
        name: true,
        group: true,
        isActive: true,
        rows: { select: { sizeLabel: true }, orderBy: { position: "asc" } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.material.findMany({ orderBy: [{ position: "asc" }, { name: "asc" }] }),
    prisma.attributeValue.findMany({
      orderBy: [{ group: { position: "asc" } }, { position: "asc" }],
      include: { group: { select: { code: true } } },
    }),
    // Màu / size là biến thể SKU, còn lại là đặc tính thiết kế (kể cả nhóm admin tự thêm)
    prisma.attributeGroup.findMany({
      where: { code: { notIn: ["COLOR", "SIZE"] } },
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      select: { code: true, name: true, nameEn: true },
    }),
  ]);

  const sizeCharts: AdminProductSizeChart[] = charts.map(({ rows, ...chart }) => ({
    ...chart,
    sizeLabels: rows.map((row) => row.sizeLabel),
  }));

  const materialOptions: AdminProductMaterialOption[] = materials.map((m) => ({
    id: m.id,
    code: m.code,
    name: m.name,
    cover: m.closeupImages[0] ?? null,
    composition: Array.isArray(m.composition)
      ? m.composition.flatMap((item) => {
          if (!item || typeof item !== "object" || Array.isArray(item)) return [];
          const { fiber, percent } = item as Record<string, unknown>;
          return typeof fiber === "string" && typeof percent === "number" ? [{ fiber, percent }] : [];
        })
      : [],
    metrics: {
      stretch: m.stretch,
      thickness: m.thickness,
      drape: m.drape,
      sheerness: m.sheerness,
      sheen: m.sheen,
    },
    careCodes: m.careCodes,
    metersPerTop: m.metersPerTop === null ? null : Number(m.metersPerTop),
    metersPerPants: m.metersPerPants === null ? null : Number(m.metersPerPants),
    isActive: m.isActive,
  }));

  const attributeOptions: AdminProductAttributeOption[] = attributes.map((a) => ({
    id: a.id,
    group: a.group.code,
    code: a.code,
    name: a.name,
    hex: a.hex,
    isActive: a.isActive,
  }));

  return { categories, sizeCharts, materials: materialOptions, attributes: attributeOptions, designGroups };
}
