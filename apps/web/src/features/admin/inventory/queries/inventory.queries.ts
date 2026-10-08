import { type Prisma } from "@repo/db";
import { prisma } from "../../server/db.server";
import { type AdminInventoryVariant } from "../types/inventory.types";

/**
 * Query: Lấy danh sách tồn kho tất cả biến thể Áo Dài (SKU, Size, Màu, Tồn kho)
 */
export async function getAdminInventoryQuery(search?: string): Promise<AdminInventoryVariant[]> {
  try {
    const whereCondition: Prisma.ProductVariantWhereInput = {};
    if (search) {
      whereCondition.OR = [
        { sku: { contains: search, mode: "insensitive" } },
        { size: { contains: search, mode: "insensitive" } },
        { color: { contains: search, mode: "insensitive" } },
        { product: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    const variants = await prisma.productVariant.findMany({
      where: whereCondition,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            images: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      take: 100,
    });

    return variants.map((v) => ({
      id: v.id,
      sku: v.sku,
      size: v.size,
      color: v.color,
      price: v.price ? Number(v.price) : null,
      stock: v.stock,
      productId: v.productId,
      productName: v.product.name,
      productImage: v.product.images?.[0] || null,
      categoryName: v.product.category?.name || "Áo Dài",
      updatedAt: v.updatedAt,
    }));
  } catch (error) {
    console.error("Lỗi khi query tồn kho:", error);
    return [];
  }
}
