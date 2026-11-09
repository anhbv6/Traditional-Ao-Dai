import { prisma, type Prisma } from '@repo/db'
import { pickLocalized, type Locale } from '@repo/shared'
import {
  isCareCode,
  isFiber,
  isSeason,
  resolveMaterialAvailability,
  topsFromRolls,
  type CompositionItem,
  type PublicMaterialDto,
} from '@repo/shared/materials'

/** JSON trong DB có thể bị sửa tay — chỉ giữ phần tử đúng dạng */
function parseComposition(value: Prisma.JsonValue): CompositionItem[] {
  if (!Array.isArray(value)) return []
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const { fiber, percent } = item as Record<string, unknown>
    return isFiber(fiber) && typeof percent === 'number' ? [{ fiber, percent }] : []
  })
}

function parseSteps(value: Prisma.JsonValue, locale: Locale): PublicMaterialDto['processSteps'] {
  if (!Array.isArray(value)) return []
  const text = (v: unknown) => (typeof v === 'string' ? v : '')
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return []
    const raw = item as Record<string, unknown>
    const step = { title: text(raw.title), titleEn: text(raw.titleEn), detail: text(raw.detail), detailEn: text(raw.detailEn) }
    if (!step.title) return []
    return [{ title: pickLocalized(step, 'title', locale), detail: pickLocalized(step, 'detail', locale) }]
  })
}

/**
 * Thư mục vải công khai: chất liệu đang dùng, nội dung theo ngôn ngữ.
 * Tồn kho chỉ quy về tình trạng (còn / sắp hết / đặt dệt) — không trả số mét thật.
 */
export async function listPublicMaterials(locale: Locale): Promise<PublicMaterialDto[]> {
  const materials = await prisma.material.findMany({
    where: { isActive: true },
    orderBy: [{ position: 'asc' }, { name: 'asc' }],
    include: {
      fabrics: {
        where: { isActive: true },
        orderBy: { remainingMeters: 'desc' },
        select: { color: true, remainingMeters: true },
      },
    },
  })

  return materials.map((material) => {
    const rolls = material.fabrics
      .map((fabric) => ({ color: fabric.color, remainingMeters: Number(fabric.remainingMeters) }))
      .filter((roll) => roll.remainingMeters > 0)
    const metersPerTop = material.metersPerTop === null ? null : Number(material.metersPerTop)
    const tops = topsFromRolls(rolls, metersPerTop)
    const colors = [...new Set(rolls.flatMap((roll) => (roll.color ? [roll.color.trim()] : [])).filter(Boolean))]

    return {
      code: material.code,
      name: pickLocalized(material, 'name', locale),
      origin: pickLocalized(material, 'origin', locale),
      description: pickLocalized(material, 'description', locale),
      composition: parseComposition(material.composition),
      processSteps: parseSteps(material.processSteps, locale),
      closeupImages: material.closeupImages,
      videoUrl: material.videoUrl,
      metrics: {
        stretch: material.stretch,
        thickness: material.thickness,
        drape: material.drape,
        sheerness: material.sheerness,
        sheen: material.sheen,
      },
      seasons: material.seasons.filter(isSeason),
      careCodes: material.careCodes.filter(isCareCode),
      careNote: pickLocalized(material, 'careNote', locale),
      widthCm: material.widthCm,
      availability: resolveMaterialAvailability(rolls.length, tops),
      colors,
    }
  })
}
