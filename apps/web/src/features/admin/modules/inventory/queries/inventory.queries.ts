import { prisma } from "../../../core/server/db.server";
import { type AdminSkuProduct, type AdminSkuStockData } from "../types/inventory.types";

/** SKU may đo không giữ tồn (may theo đơn) nên không hiện ở màn tồn kho */
const CUSTOM_SIZE = "CUSTOM";

/**
 * Tồn kho SKU gom theo sản phẩm (bỏ SKU may đo) + thứ tự size theo thuộc tính SIZE.
 */
export async function getAdminSkuStockQuery(): Promise<AdminSkuStockData> {
  const [products, sizeValues] = await Promise.all([
    prisma.product.findMany({
      where: { variants: { some: { size: { not: CUSTOM_SIZE } } } },
      select: {
        id: true,
        code: true,
        name: true,
        nameEn: true,
        images: true,
        isActive: true,
        category: { select: { name: true, nameEn: true, group: true } },
        variants: {
          where: { size: { not: CUSTOM_SIZE } },
          select: {
            id: true,
            sku: true,
            size: true,
            color: true,
            colorId: true,
            stock: true,
            updatedAt: true,
            colorValue: { select: { name: true, hex: true, position: true } },
          },
        },
      },
      orderBy: { code: "asc" },
    }),
    prisma.attributeValue.findMany({
      where: { group: { code: "SIZE" } },
      select: { code: true, name: true },
      orderBy: { position: "asc" },
    }),
  ]);

  // Ký hiệu size của SKU có thể là mã hoặc tên giá trị — đưa cả hai vào thứ tự
  const sizeOrder = [...new Set(sizeValues.flatMap((value) => [value.name, value.code]))];

  const items: AdminSkuProduct[] = products.map((product) => ({
    id: product.id,
    code: product.code,
    name: product.name,
    nameEn: product.nameEn,
    image: product.images[0] ?? null,
    categoryName: product.category.name,
    categoryNameEn: product.category.nameEn,
    group: product.category.group,
    isActive: product.isActive,
    variants: product.variants
      .sort((a, b) => (a.colorValue?.position ?? 0) - (b.colorValue?.position ?? 0))
      .map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        size: variant.size,
        colorId: variant.colorId,
        colorName: variant.colorValue?.name ?? variant.color,
        hex: variant.colorValue?.hex ?? null,
        stock: variant.stock,
        updatedAt: variant.updatedAt.toISOString(),
      })),
  }));

  return { products: items, sizeOrder, now: new Date().toISOString() };
}
