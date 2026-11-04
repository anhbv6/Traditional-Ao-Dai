import { z } from "zod";
import {
  CARE_CODES,
  FIBERS,
  MAX_CLOSEUP_IMAGES,
  MAX_COMPOSITION_ITEMS,
  MAX_PROCESS_STEPS,
  SEASONS,
} from "../utils/materialMeta";

const metric = z.number().int().min(1).max(5).nullable();
const optionalText = (max: number) => z.string().trim().max(max);

export const materialCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]+(-[A-Z0-9]+)*$/, "MATERIAL_CODE_INVALID")
  .max(40);

export const createMaterialSchema = z.object({
  code: materialCodeSchema,
  name: z.string().trim().min(1, "MATERIAL_NAME_REQUIRED").max(120),
});

export const materialFormSchema = z.object({
  code: materialCodeSchema,
  name: z.string().trim().min(1, "MATERIAL_NAME_REQUIRED").max(120),
  nameEn: optionalText(120),
  origin: optionalText(120),
  originEn: optionalText(120),
  description: optionalText(1000),
  descriptionEn: optionalText(1000),
  composition: z
    .array(z.object({ fiber: z.enum(FIBERS), percent: z.number().int().min(1).max(100) }))
    .max(MAX_COMPOSITION_ITEMS)
    // Đã khai thành phần thì phải đủ 100% và không trùng sợi
    .refine(
      (items) => items.length === 0 || items.reduce((sum, item) => sum + item.percent, 0) === 100,
      "MATERIAL_COMPOSITION_INVALID"
    )
    .refine((items) => new Set(items.map((item) => item.fiber)).size === items.length, "MATERIAL_COMPOSITION_INVALID"),
  processSteps: z
    .array(
      z.object({
        title: z.string().trim().min(1, "MATERIAL_STEP_TITLE_REQUIRED").max(80),
        titleEn: optionalText(80),
        detail: optionalText(400),
        detailEn: optionalText(400),
      })
    )
    .max(MAX_PROCESS_STEPS),
  closeupImages: z.array(z.url()).max(MAX_CLOSEUP_IMAGES),
  videoUrl: z.url({ protocol: /^https?$/, error: "MATERIAL_VIDEO_URL_INVALID" }).or(z.literal("")),
  metrics: z.object({ stretch: metric, thickness: metric, drape: metric, sheerness: metric, sheen: metric }),
  seasons: z.array(z.enum(SEASONS)).max(SEASONS.length),
  careCodes: z.array(z.enum(CARE_CODES)).max(CARE_CODES.length),
  careNote: optionalText(500),
  careNoteEn: optionalText(500),
  widthCm: z.number().int().min(30).max(400).nullable(),
  metersPerTop: z.number().min(0.1).max(20).nullable(),
  metersPerPants: z.number().min(0.1).max(20).nullable(),
  isActive: z.boolean(),
});

export const updateMaterialSchema = materialFormSchema.extend({ materialId: z.uuid() });
export const materialIdSchema = z.object({ materialId: z.uuid() });

export type MaterialFormValues = z.infer<typeof materialFormSchema>;
