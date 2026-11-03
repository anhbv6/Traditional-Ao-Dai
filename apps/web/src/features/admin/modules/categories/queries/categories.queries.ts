import { prisma } from "../../../core/server/db.server";
import { type AdminCategoryNode, type SizeChartOption } from "../types/categories.types";

/** Query: cây loại sản phẩm (nhóm gốc → loại con) theo thứ tự hiển thị, kèm số sản phẩm và SKU */
export async function getCategoryTreeQuery(): Promise<AdminCategoryNode[]> {
  try {
    const categories = await prisma.category.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      include: { products: { select: { _count: { select: { variants: true } } } } },
    });

    const nodes = new Map<string, AdminCategoryNode>(
      categories.map((c) => [
        c.id,
        {
          id: c.id,
          name: c.name,
          nameEn: c.nameEn,
          slug: c.slug,
          description: c.description,
          descriptionEn: c.descriptionEn,
          group: c.group,
          position: c.position,
          isActive: c.isActive,
          parentId: c.parentId,
          defaultSizeChartId: c.defaultSizeChartId,
          productCount: c.products.length,
          skuCount: c.products.reduce((sum, p) => sum + p._count.variants, 0),
          children: [],
        },
      ])
    );

    const roots: AdminCategoryNode[] = [];
    for (const node of nodes.values()) {
      const parent = node.parentId ? nodes.get(node.parentId) : undefined;
      if (parent) parent.children.push(node);
      else roots.push(node);
    }
    return roots;
  } catch (error) {
    console.error("Lỗi khi query cây loại sản phẩm:", error);
    return [];
  }
}

/** Query: bảng size để gắn mặc định cho loại sản phẩm / sản phẩm */
export async function getSizeChartOptionsQuery(): Promise<SizeChartOption[]> {
  try {
    return await prisma.sizeChart.findMany({
      select: { id: true, name: true, group: true, isActive: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Lỗi khi query danh sách bảng size:", error);
    return [];
  }
}
