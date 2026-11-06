import { prisma } from "../../../core/server/db.server";
import { type AdminAttributeData, type AdminAttributeGroup, type AdminAttributeValue } from "../types/attributes.types";
import { isColorFamily } from "../utils/attributeMeta";

const norm = (value: string) => value.trim().toLowerCase();

/**
 * Query: nhóm thuộc tính theo thứ tự + mọi giá trị, kèm số SKU đang dùng cho màu (theo tên màu của biến thể, không
 * phân biệt hoa thường) và size (theo ký hiệu size). Biến thể chưa liên kết khóa ngoại tới thuộc tính nên khớp theo chữ.
 */
export async function getAdminAttributeDataQuery(): Promise<AdminAttributeData> {
  const [groups, values, byColor, bySize] = await Promise.all([
    prisma.attributeGroup.findMany({
      orderBy: [{ position: "asc" }, { createdAt: "asc" }],
      include: { _count: { select: { values: true } } },
    }),
    prisma.attributeValue.findMany({
      orderBy: [{ position: "asc" }, { name: "asc" }],
      include: { group: { select: { code: true } } },
    }),
    prisma.productVariant.groupBy({ by: ["color"], _count: { _all: true }, where: { color: { not: null } } }),
    prisma.productVariant.groupBy({ by: ["size"], _count: { _all: true } }),
  ]);

  const colorCount = new Map<string, number>();
  for (const row of byColor) {
    if (!row.color) continue;
    colorCount.set(norm(row.color), (colorCount.get(norm(row.color)) ?? 0) + row._count._all);
  }
  const sizeCount = new Map(bySize.map((row) => [row.size.toUpperCase(), row._count._all]));

  const groupItems: AdminAttributeGroup[] = groups.map((group) => ({
    id: group.id,
    code: group.code,
    name: group.name,
    nameEn: group.nameEn,
    description: group.description,
    descriptionEn: group.descriptionEn,
    isSystem: group.isSystem,
    position: group.position,
    valueCount: group._count.values,
  }));

  const valueItems: AdminAttributeValue[] = values.map((value) => ({
    id: value.id,
    groupId: value.groupId,
    group: value.group.code,
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
      value.group.code === "COLOR"
        ? (colorCount.get(norm(value.name)) ?? 0)
        : value.group.code === "SIZE"
          ? (sizeCount.get(value.code) ?? 0)
          : null,
  }));

  return { groups: groupItems, values: valueItems };
}
