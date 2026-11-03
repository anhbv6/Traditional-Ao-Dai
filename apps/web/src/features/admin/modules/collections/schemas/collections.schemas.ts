import { z } from "zod";
import {
  COLLECTION_CODE_PATTERN,
  COLLECTION_STATUSES,
  MAX_COLLECTION_PRODUCTS,
  MAX_GALLERY_IMAGES,
  MAX_HIGHLIGHTED_PRODUCTS,
} from "../utils/collectionLifecycle";

const imageUrl = z.string().regex(/^(https:\/\/|\/)/, "VALIDATION_ERROR");
const optionalText = (max: number) => z.string().trim().max(max);
const dateInput = z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "VALIDATION_ERROR");

const collectionCode = z.string().trim().toUpperCase().regex(COLLECTION_CODE_PATTERN, "COLLECTION_CODE_INVALID");

export const collectionIdSchema = z.object({ collectionId: z.uuid() });

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "COLLECTION_NAME_REQUIRED").max(120),
  code: collectionCode,
});

const collectionFields = z.object({
  collectionId: z.uuid(),
  name: z.string().trim().min(1, "COLLECTION_NAME_REQUIRED").max(120),
  nameEn: optionalText(120),
  code: collectionCode,
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "COLLECTION_SLUG_INVALID")
    .max(120),
  tagline: optionalText(160),
  taglineEn: optionalText(160),
  season: optionalText(60),
  seasonEn: optionalText(60),
  description: optionalText(3000),
  descriptionEn: optionalText(3000),
  story: optionalText(8000),
  storyEn: optionalText(8000),
  coverImage: imageUrl.or(z.literal("")),
  coverImageMobile: imageUrl.or(z.literal("")),
  bannerImage: imageUrl.or(z.literal("")),
  bannerImageMobile: imageUrl.or(z.literal("")),
  autoPushOosToBottom: z.boolean(),
  gallery: z.array(imageUrl).max(MAX_GALLERY_IMAGES),
  accentColor: z.string().regex(/^(#[0-9a-fA-F]{6})?$/, "COLLECTION_ACCENT_INVALID"),
  launchAt: dateInput,
  endAt: dateInput,
  showOnHomepage: z.boolean(),
  homepageOrder: z.number("VALIDATION_ERROR").int().min(0).max(99),
  showInLookbook: z.boolean(),
  seoTitle: optionalText(120),
  seoTitleEn: optionalText(120),
  seoDescription: optionalText(320),
  seoDescriptionEn: optionalText(320),
  products: z
    .array(z.object({ productId: z.uuid("COLLECTION_PRODUCT_INVALID"), isHighlighted: z.boolean() }))
    .max(MAX_COLLECTION_PRODUCTS),
});

/** Dùng chung cho form ở client và kiểm tra lại ở Server Action */
export const saveCollectionSchema = collectionFields.superRefine((values, ctx) => {
  // So sánh chuỗi YYYY-MM-DD là đủ vì cùng định dạng
  if (values.launchAt && values.endAt && values.endAt < values.launchAt) {
    ctx.addIssue({ code: "custom", path: ["endAt"], message: "COLLECTION_DATE_RANGE_INVALID" });
  }
  if (values.products.filter((p) => p.isHighlighted).length > MAX_HIGHLIGHTED_PRODUCTS) {
    ctx.addIssue({ code: "custom", path: ["products"], message: "COLLECTION_HIGHLIGHT_LIMIT" });
  }
  if (new Set(values.products.map((p) => p.productId)).size !== values.products.length) {
    ctx.addIssue({ code: "custom", path: ["products"], message: "COLLECTION_PRODUCT_INVALID" });
  }
});

export const changeCollectionStatusSchema = z.object({
  collectionId: z.uuid(),
  status: z.enum(COLLECTION_STATUSES),
  activateReadyProducts: z.boolean(),
  hideExclusiveProducts: z.boolean(),
});

export const setCollectionHomepageSchema = z.object({ collectionId: z.uuid(), showOnHomepage: z.boolean() });

export type SaveCollectionValues = z.infer<typeof saveCollectionSchema>;
