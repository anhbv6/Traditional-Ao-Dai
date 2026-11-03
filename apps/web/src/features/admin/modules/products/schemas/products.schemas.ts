import { z } from "zod";
import { toVariantKey } from "../utils/products.utils";

export const toggleProductActiveSchema = z.object({ productId: z.uuid(), isActive: z.boolean() });
export const toggleProductCustomFitSchema = z.object({ productId: z.uuid(), isCustomFit: z.boolean() });
export const bulkSetProductsActiveSchema = z.object({
  productIds: z.array(z.uuid()).min(1).max(100),
  isActive: z.boolean(),
});
export const productIdSchema = z.object({ productId: z.uuid() });

const productVariantSchema = z.object({
  /** Có id = SKU đã tồn tại, không có = SKU mới */
  id: z.uuid().optional(),
  /** true = server sinh mã theo quy tắc, bỏ qua `sku` */
  skuAuto: z.boolean(),
  sku: z.string().trim().toUpperCase().max(64),
  size: z.string().trim().min(1, "PRODUCT_SIZE_REQUIRED").max(20),
  color: z.string().trim().max(50),
  /** true = dùng giá bán chung của sản phẩm, bỏ qua `price` */
  useBasePrice: z.boolean(),
  price: z.number("PRODUCT_PRICE_INVALID").int("PRODUCT_PRICE_INVALID").positive("PRODUCT_PRICE_INVALID").nullable(),
  stock: z.number("PRODUCT_STOCK_INVALID").int("PRODUCT_STOCK_INVALID").min(0, "PRODUCT_STOCK_INVALID"),
});

const productFields = z.object({
  name: z.string().trim().min(1, "PRODUCT_NAME_REQUIRED").max(200),
  nameEn: z.string().trim().max(200),
  categoryId: z.uuid("PRODUCT_CATEGORY_REQUIRED"),
  /** Chuỗi rỗng = dùng bảng size mặc định của loại sản phẩm */
  sizeChartId: z.uuid().or(z.literal("")),
  material: z.string().trim().max(200),
  materialEn: z.string().trim().max(200),
  description: z.string().trim().max(5000),
  descriptionEn: z.string().trim().max(5000),
  basePrice: z.number("PRODUCT_PRICE_INVALID").int("PRODUCT_PRICE_INVALID").positive("PRODUCT_PRICE_INVALID"),
  // Chỉ nhận ảnh https hoặc đường dẫn trong site — giá trị này được đưa thẳng vào thẻ ảnh của storefront
  images: z.array(z.string().regex(/^(https:\/\/|\/)/)).max(8),
  isActive: z.boolean(),
  isCustomFit: z.boolean(),
  isFeatured: z.boolean(),
  /** Mã bộ sưu tập dùng để sinh SKU (VD TET26), không lưu riêng; trống thì lấy theo tên sản phẩm */
  collectionCode: z
    .string()
    .trim()
    .toUpperCase()
    .max(12)
    .regex(/^[A-Z0-9]*$/, "PRODUCT_COLLECTION_CODE_INVALID"),
  variants: z.array(productVariantSchema).max(100),
});

/** Quy tắc giữa các dòng biến thể: mã tay bắt buộc, giá riêng bắt buộc, không trùng size trong cùng màu, không trùng SKU */
function validateVariants(values: z.output<typeof productFields>, ctx: z.RefinementCtx) {
  const seenKeys = new Set<string>();
  const seenSkus = new Set<string>();

  values.variants.forEach((variant, index) => {
    const path = ["variants", index];
    if (!variant.skuAuto && !variant.sku) {
      ctx.addIssue({ code: "custom", path: [...path, "sku"], message: "PRODUCT_SKU_REQUIRED" });
    }
    if (!variant.useBasePrice && variant.price === null) {
      ctx.addIssue({ code: "custom", path: [...path, "price"], message: "PRODUCT_PRICE_REQUIRED" });
    }

    const key = toVariantKey(variant);
    if (seenKeys.has(key)) {
      ctx.addIssue({ code: "custom", path: [...path, "size"], message: "PRODUCT_SIZE_DUPLICATE" });
    }
    seenKeys.add(key);

    if (!variant.skuAuto && variant.sku) {
      if (seenSkus.has(variant.sku)) {
        ctx.addIssue({ code: "custom", path: [...path, "sku"], message: "PRODUCT_SKU_DUPLICATE" });
      }
      seenSkus.add(variant.sku);
    }
  });
}

/** Dùng chung cho form ở client và kiểm tra lại ở Server Action */
export const productFormSchema = productFields.superRefine(validateVariants);

export const updateProductSchema = productFields.extend({ productId: z.uuid() }).superRefine(validateVariants);

export type ProductFormValues = z.infer<typeof productFormSchema>;
