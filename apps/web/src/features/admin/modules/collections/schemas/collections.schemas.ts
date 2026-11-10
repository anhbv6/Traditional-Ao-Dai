import { z } from "zod";
import {
  COLLECTION_CODE_PATTERN,
  COLLECTION_STATUSES,
  MAX_COLLECTION_PRODUCTS,
  MAX_GALLERY_IMAGES,
  MAX_HIGHLIGHTED_PRODUCTS,
} from "../utils/collectionLifecycle";

/** Độ dài tối đa từng trường chữ — dùng chung cho schema và thuộc tính `maxLength` của ô nhập ở trình soạn */
export const COLLECTION_TEXT_LIMITS = {
  name: 120,
  slug: 120,
  tagline: 160,
  season: 60,
  description: 3000,
  story: 8000,
  seoTitle: 120,
  seoDescription: 320,
} as const;

const imageUrl = z.string().regex(/^(https:\/\/|\/)/, "VALIDATION_ERROR");
// Thông điệp là mã KEY để trình soạn hiện lỗi dưới ô (không để mặc định tiếng Anh của Zod)
const optionalText = (max: number) => z.string().trim().max(max, "COLLECTION_TEXT_TOO_LONG");
const dateInput = z.string().regex(/^(\d{4}-\d{2}-\d{2})?$/, "VALIDATION_ERROR");

const collectionCode = z.string().trim().toUpperCase().regex(COLLECTION_CODE_PATTERN, "COLLECTION_CODE_INVALID");

export const collectionIdSchema = z.object({ collectionId: z.uuid() });

export const createCollectionSchema = z.object({
  name: z.string().trim().min(1, "COLLECTION_NAME_REQUIRED").max(COLLECTION_TEXT_LIMITS.name, "COLLECTION_TEXT_TOO_LONG"),
  code: collectionCode,
});

const LIMITS = COLLECTION_TEXT_LIMITS;

const collectionFields = z.object({
  collectionId: z.uuid(),
  name: z.string().trim().min(1, "COLLECTION_NAME_REQUIRED").max(LIMITS.name, "COLLECTION_TEXT_TOO_LONG"),
  nameEn: optionalText(LIMITS.name),
  code: collectionCode,
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "COLLECTION_SLUG_INVALID")
    .max(LIMITS.slug, "COLLECTION_TEXT_TOO_LONG"),
  tagline: optionalText(LIMITS.tagline),
  taglineEn: optionalText(LIMITS.tagline),
  season: optionalText(LIMITS.season),
  seasonEn: optionalText(LIMITS.season),
  description: optionalText(LIMITS.description),
  descriptionEn: optionalText(LIMITS.description),
  story: optionalText(LIMITS.story),
  storyEn: optionalText(LIMITS.story),
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
  homepageOrder: z
    .number("COLLECTION_HOMEPAGE_ORDER_INVALID")
    .int("COLLECTION_HOMEPAGE_ORDER_INVALID")
    .min(0, "COLLECTION_HOMEPAGE_ORDER_INVALID")
    .max(99, "COLLECTION_HOMEPAGE_ORDER_INVALID"),
  showInLookbook: z.boolean(),
  seoTitle: optionalText(LIMITS.seoTitle),
  seoTitleEn: optionalText(LIMITS.seoTitle),
  seoDescription: optionalText(LIMITS.seoDescription),
  seoDescriptionEn: optionalText(LIMITS.seoDescription),
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
