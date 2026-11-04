import { prisma } from "../../../core/server/db.server";
import { type AdminAttributeValue } from "../types/attributes.types";
import { isColorFamily } from "../utils/attributeMeta";

const norm = (value: string) => value.trim().toLowerCase();

/**
 * Query: mọi giá trị thuộc tính, kèm số SKU đang dùng cho màu (theo tên màu của biến thể, không phân biệt hoa thường)
 * và size (theo ký hiệu size). Biến thể chưa liên kết khóa ngoại tới thuộc tính nên khớp theo chữ.
 */
export async function getAdminAttributesQuery(): Promise<AdminAttributeValue[]> {
  const [values, byColor, bySize] = await Promise.all([
    prisma.attributeValue.findMany({ orderBy: [{ group: "asc" }, { position: "asc" }, { name: "asc" }] }),
    prisma.productVariant.groupBy({ by: ["color"], _count: { _all: true }, where: { color: { not: null } } }),
    prisma.productVariant.groupBy({ by: ["size"], _count: { _all: true } }),
  ]);

  const colorCount = new Map<string, number>();
  for (const row of byColor) {
    if (!row.color) continue;
    colorCount.set(norm(row.color), (colorCount.get(norm(row.color)) ?? 0) + row._count._all);
  }
  const sizeCount = new Map(bySize.map((row) => [row.size.toUpperCase(), row._count._all]));

  return values.map((value) => ({
    id: value.id,
    group: value.group,
    code: value.code,
    name: value.name,
    nameEn: value.nameEn,
    description: value.description,
    descriptionEn: value.descriptionEn,
    hex: value.hex,
    family: isColorFamily(value.family) ? value.family : null,
    isActive: value.isActive,
    position: value.position,
    skuCount:
      value.group === "COLOR"
        ? (colorCount.get(norm(value.name)) ?? 0)
        : value.group === "SIZE"
          ? (sizeCount.get(value.code) ?? 0)
          : null,
  }));
}
