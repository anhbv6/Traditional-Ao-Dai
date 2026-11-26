import { prisma } from "../../../core/server/db.server";
import { type AdminFabricRollDetailData, type AdminFabricStockData } from "../types/fabrics.types";

/**
 * Đọc toàn bộ dữ liệu phục vụ màn hình Kho vải:
 * - Danh sách cây vải kèm biến động gần nhất
 * - Danh mục chất liệu (định mức khổ / thân áo / quần)
 * - Bảng màu chuẩn từ AttributeValue
 * - Danh sách sản phẩm (để liên kết ẩn/hiện sản phẩm khi hết vải)
 */
export async function getFabricStockDataQuery(): Promise<AdminFabricStockData> {
  const [fabrics, materials, colors, products] = await Promise.all([
    prisma.fabric.findMany({
      include: {
        movements: {
          include: {
            actor: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 30,
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.material.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        nameEn: true,
        widthCm: true,
        metersPerTop: true,
        metersPerPants: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.attributeValue.findMany({
      where: {
        group: { code: "COLOR" },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        nameEn: true,
        hex: true,
      },
      orderBy: { position: "asc" },
    }),
    prisma.product.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
        materialId: true,
        basePrice: true,
        images: true,
        variants: {
          select: { colorId: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return {
    rolls: fabrics.map((f) => ({
      id: f.id,
      code: f.code,
      name: f.name,
      nameEn: f.nameEn,
      materialId: f.materialId ?? "",
      colorId: f.colorId,
      receivedMeters: Number(f.receivedMeters ?? f.remainingMeters),
      remainingMeters: Number(f.remainingMeters),
      lowStockThreshold: Number(f.lowStockThreshold),
      isActive: f.isActive,
      productId: f.productId,
      receivedAt: f.createdAt.toISOString(),
      updatedAt: f.updatedAt.toISOString(),
      movements: f.movements.map((m) => ({
        id: m.id,
        type: m.type,
        delta: Number(m.delta),
        balanceAfter: Number(m.balanceAfter),
        orderCode: m.orderCode,
        note: m.note,
        actorName: m.actor?.name ?? "Hệ thống",
        createdAt: m.createdAt.toISOString(),
      })),
    })),
    materials: materials.map((m) => ({
      id: m.id,
      code: m.code,
      name: m.name,
      nameEn: m.nameEn,
      widthCm: m.widthCm,
      metersPerTop: m.metersPerTop ? Number(m.metersPerTop) : null,
      metersPerPants: m.metersPerPants ? Number(m.metersPerPants) : null,
    })),
    colors: colors
      .filter((c): c is typeof c & { hex: string } => Boolean(c.hex))
      .map((c) => ({
        id: c.id,
        name: c.name,
        nameEn: c.nameEn,
        hex: c.hex,
      })),
    products: products.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      materialId: p.materialId,
      colorIds: p.variants.map((v) => v.colorId).filter((id): id is string => Boolean(id)),
      isVisible: p.isActive,
      image: p.images[0] ?? null,
      basePrice: Number(p.basePrice),
    })),
    now: new Date().toISOString(),
  };
}

/**
 * Đọc thông tin chi tiết một cây vải cùng toàn bộ lịch sử biến động và danh mục lựa chọn
 */
export async function getAdminFabricRollDetailQuery(id: string): Promise<AdminFabricRollDetailData | null> {
  const [fabric, materials, colors, products] = await Promise.all([
    prisma.fabric.findUnique({
      where: { id },
      include: {
        movements: {
          include: {
            actor: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    }),
    prisma.material.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        nameEn: true,
        widthCm: true,
        metersPerTop: true,
        metersPerPants: true,
      },
      orderBy: { name: "asc" },
    }),
    prisma.attributeValue.findMany({
      where: {
        group: { code: "COLOR" },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        nameEn: true,
        hex: true,
      },
      orderBy: { position: "asc" },
    }),
    prisma.product.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
        materialId: true,
        basePrice: true,
        images: true,
        variants: {
          select: { colorId: true },
        },
      },
      orderBy: { name: "asc" },
    }),
  ]);

  if (!fabric) return null;

  return {
    roll: {
      id: fabric.id,
      code: fabric.code,
      name: fabric.name,
      nameEn: fabric.nameEn,
      materialId: fabric.materialId ?? "",
      colorId: fabric.colorId,
      receivedMeters: Number(fabric.receivedMeters ?? fabric.remainingMeters),
      remainingMeters: Number(fabric.remainingMeters),
      lowStockThreshold: Number(fabric.lowStockThreshold),
      isActive: fabric.isActive,
      productId: fabric.productId,
      receivedAt: fabric.createdAt.toISOString(),
      updatedAt: fabric.updatedAt.toISOString(),
      movements: fabric.movements.map((m) => ({
        id: m.id,
        type: m.type,
        delta: Number(m.delta),
        balanceAfter: Number(m.balanceAfter),
        orderCode: m.orderCode,
        note: m.note,
        actorName: m.actor?.name ?? "Hệ thống",
        createdAt: m.createdAt.toISOString(),
      })),
    },
    materials: materials.map((m) => ({
      id: m.id,
      code: m.code,
      name: m.name,
      nameEn: m.nameEn,
      widthCm: m.widthCm,
      metersPerTop: m.metersPerTop ? Number(m.metersPerTop) : null,
      metersPerPants: m.metersPerPants ? Number(m.metersPerPants) : null,
    })),
    colors: colors
      .filter((c): c is typeof c & { hex: string } => Boolean(c.hex))
      .map((c) => ({
        id: c.id,
        name: c.name,
        nameEn: c.nameEn,
        hex: c.hex,
      })),
    products: products.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      materialId: p.materialId,
      colorIds: p.variants.map((v) => v.colorId).filter((id): id is string => Boolean(id)),
      isVisible: p.isActive,
      image: p.images[0] ?? null,
      basePrice: Number(p.basePrice),
    })),
    now: new Date().toISOString(),
  };
}
