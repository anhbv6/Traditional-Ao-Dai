import { type Prisma } from "@repo/db";
import { prisma } from "../../../core/server/db.server";
import {
  type AdminMaterialDetail,
  type AdminMaterialListItem,
  type CompositionItem,
  type MaterialMetrics,
  type ProcessStep,
} from "../types/materials.types";
import { isCareCode, isFiber, topsFromRolls, type Season } from "../utils/materialMeta";

/** JSON trong DB có thể bị sửa tay — chỉ giữ phần tử đúng dạng */
function parseComposition(value: Prisma.JsonValue): CompositionItem[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const { fiber, percent } = item as Record<string, unknown>;
    return isFiber(fiber) && typeof percent === "number" ? [{ fiber, percent }] : [];
  });
}

function parseSteps(value: Prisma.JsonValue): ProcessStep[] {
  if (!Array.isArray(value)) return [];
  const text = (v: unknown) => (typeof v === "string" ? v : "");
  return value.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const step = item as Record<string, unknown>;
    return text(step.title)
      ? [{ title: text(step.title), titleEn: text(step.titleEn), detail: text(step.detail), detailEn: text(step.detailEn) }]
      : [];
  });
}

type MetricColumns = Record<keyof MaterialMetrics, number | null>;
const toMetrics = (m: MetricColumns): MaterialMetrics => ({
  stretch: m.stretch,
  thickness: m.thickness,
  drape: m.drape,
  sheerness: m.sheerness,
  sheen: m.sheen,
});

const decimalToNumber = (value: Prisma.Decimal | null) => (value === null ? null : Number(value));

/** Query: danh sách chất liệu kèm tồn kho vải (chỉ cây đang dùng) */
export async function getAdminMaterialsQuery(): Promise<AdminMaterialListItem[]> {
  const materials = await prisma.material.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { fabrics: { where: { isActive: true }, select: { remainingMeters: true } } },
  });
  return materials.map((material) => {
    const rolls = material.fabrics.map((fabric) => ({ remainingMeters: Number(fabric.remainingMeters) }));
    const metersPerTop = decimalToNumber(material.metersPerTop);
    return {
      id: material.id,
      code: material.code,
      name: material.name,
      origin: material.origin,
      cover: material.closeupImages[0] ?? null,
      composition: parseComposition(material.composition),
      metrics: toMetrics(material),
      seasons: material.seasons as Season[],
      metersPerTop,
      isActive: material.isActive,
      rollCount: rolls.length,
      remainingMeters: Math.round(rolls.reduce((sum, roll) => sum + roll.remainingMeters, 0) * 100) / 100,
      topsAvailable: topsFromRolls(rolls, metersPerTop),
    };
  });
}

/** Query: chi tiết một chất liệu kèm các cây vải trong kho */
export async function getAdminMaterialDetailQuery(id: string): Promise<AdminMaterialDetail | null> {
  const material = await prisma.material.findUnique({
    where: { id },
    include: {
      fabrics: {
        where: { isActive: true },
        orderBy: { remainingMeters: "desc" },
        select: { id: true, code: true, name: true, color: true, remainingMeters: true, lowStockThreshold: true },
      },
    },
  });
  if (!material) return null;
  return {
    id: material.id,
    code: material.code,
    name: material.name,
    nameEn: material.nameEn,
    origin: material.origin,
    originEn: material.originEn,
    description: material.description,
    descriptionEn: material.descriptionEn,
    composition: parseComposition(material.composition),
    processSteps: parseSteps(material.processSteps),
    closeupImages: material.closeupImages,
    videoUrl: material.videoUrl,
    metrics: toMetrics(material),
    seasons: material.seasons as Season[],
    careCodes: material.careCodes.filter(isCareCode),
    careNote: material.careNote,
    careNoteEn: material.careNoteEn,
    widthCm: material.widthCm,
    metersPerTop: decimalToNumber(material.metersPerTop),
    metersPerPants: decimalToNumber(material.metersPerPants),
    isActive: material.isActive,
    rolls: material.fabrics.map((fabric) => ({
      id: fabric.id,
      code: fabric.code,
      name: fabric.name,
      color: fabric.color,
      remainingMeters: Number(fabric.remainingMeters),
      isLow: fabric.remainingMeters.lessThan(fabric.lowStockThreshold),
    })),
    updatedAt: material.updatedAt.toISOString(),
  };
}
