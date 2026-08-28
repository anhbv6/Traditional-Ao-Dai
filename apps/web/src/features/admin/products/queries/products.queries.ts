import { prisma } from "../../server/db.server";
import { type AdminProductItem, type CategoryOption } from "../types/products.types";

/**
 * Query: Lấy danh sách sản phẩm Áo Dài kèm số lượng tồn kho theo biến thể
 */
export async function getAdminProductsListQuery(search?: string): Promise<AdminProductItem[]> {
  try {
    const whereCondition: any = {};
    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
        { material: { contains: search, mode: "insensitive" } },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereCondition,
      include: {
        category: {
          select: { id: true, name: true },
        },
        variants: {
          select: { id: true, stock: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return products.map((p) => {
      const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
      return {
        id: p.id,
        name: p.name,
        slug: p.slug,
        material: p.material,
        basePrice: Number(p.basePrice),
        images: p.images,
        soldCount: p.soldCount,
        isCustomFit: p.isCustomFit,
        isActive: p.isActive,
        isFeatured: p.isFeatured,
        categoryId: p.categoryId,
        categoryName: p.category?.name || "Chưa phân loại",
        variantsCount: p.variants.length,
        totalStock,
        createdAt: p.createdAt,
      };
    });
  } catch (error) {
    console.error("Lỗi khi query danh sách sản phẩm Admin:", error);
    return [];
  }
}

/**
 * Query: Lấy danh sách danh mục để lọc / chọn khi tạo áo dài
 */
export async function getCategoriesOptionQuery(): Promise<CategoryOption[]> {
  try {
    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
    return categories;
  } catch (error) {
    console.error("Lỗi khi query danh mục:", error);
    return [];
  }
}
