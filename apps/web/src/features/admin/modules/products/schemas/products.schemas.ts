import { z } from "zod";
import { SALE_MODES, comboKey } from "../utils/saleModes";

export const toggleProductActiveSchema = z.object({ productId: z.uuid(), isActive: z.boolean() });
export const toggleProductCustomFitSchema = z.object({ productId: z.uuid(), isCustomFit: z.boolean() });
export const bulkSetProductsActiveSchema = z.object({
  productIds: z.array(z.uuid()).min(1).max(100),
  isActive: z.boolean(),
});
export const productIdSchema = z.object({ productId: z.uuid() });

/** Tạo nhanh: tên + loại sản phẩm + hình thức bán; mọi thứ khác nhập ở màn chi tiết */
export const createProductSchema = z.object({
  name: z.string().trim().min(1, "PRODUCT_NAME_REQUIRED").max(200),
  categoryId: z.uuid("PRODUCT_CATEGORY_REQUIRED"),
  saleMode: z.enum(SALE_MODES),
});

const productVariantSchema = z.object({
  /** Có id = SKU đã tồn tại, không có = SKU mới */
  id: z.uuid().optional(),
  /** true = server sinh mã theo quy tắc, bỏ qua `sku` */
  skuAuto: z.boolean(),
  sku: z.string().trim().toUpperCase().max(64),
  size: z.string().trim().min(1, "PRODUCT_SIZE_REQUIRED").max(20),
  /** Thuộc tính màu; null = không màu (hoặc SKU cũ chỉ có tên màu dạng chữ ở `color`) */
  colorId: z.uuid().nullable(),
  color: z.string().trim().max(50),
  /** null = dùng giá bán chung của sản phẩm */
  price: z.number("PRODUCT_PRICE_INVALID").int("PRODUCT_PRICE_INVALID").positive("PRODUCT_PRICE_INVALID").nullable(),
  stock: z.number("PRODUCT_STOCK_INVALID").int("PRODUCT_STOCK_INVALID").min(0, "PRODUCT_STOCK_INVALID"),
});

const setItemSchema = z.object({
  label: z.string().trim().min(1, "PRODUCT_SET_ITEM_REQUIRED").max(60),
  labelEn: z.string().trim().max(60),
  quantity: z.number().int().min(1).max(20),
  materialId: z.uuid().nullable(),
});

const productFields = z.object({
  name: z.string().trim().min(1, "PRODUCT_NAME_REQUIRED").max(200),
  nameEn: z.string().trim().max(200),
  description: z.string().trim().max(5000),
  descriptionEn: z.string().trim().max(5000),
  categoryId: z.uuid("PRODUCT_CATEGORY_REQUIRED"),
  saleMode: z.enum(SALE_MODES),
  setItems: z.array(setItemSchema).max(8),
  leadTimeDays: z.number().int().min(1).max(180).nullable(),
  materialId: z.uuid().nullable(),
  /** Chuỗi rỗng = dùng bảng size mặc định của loại sản phẩm */
  sizeChartId: z.uuid().or(z.literal("")),
  basePrice: z.number("PRODUCT_PRICE_INVALID").int("PRODUCT_PRICE_INVALID").min(0, "PRODUCT_PRICE_INVALID"),
  // Chỉ nhận ảnh https hoặc đường dẫn trong site — giá trị này được đưa thẳng vào thẻ ảnh của storefront
  images: z.array(z.string().regex(/^(https:\/\/|\/)/)).max(8),
  attributeIds: z.array(z.uuid()).max(40),
  isActive: z.boolean(),
  isCustomFit: z.boolean(),
  isFeatured: z.boolean(),
  variants: z.array(productVariantSchema).max(200),
});

/** Quy tắc giữa các dòng: mã tay bắt buộc, không trùng tổ hợp màu + size, không trùng SKU; bộ cần ít nhất 2 món */
function validateProduct(values: z.output<typeof productFields>, ctx: z.RefinementCtx) {
  if (values.saleMode === "SET" && values.setItems.length < 2) {
    ctx.addIssue({ code: "custom", path: ["setItems"], message: "PRODUCT_SET_ITEMS_MIN" });
  }

  const seenKeys = new Set<string>();
  const seenSkus = new Set<string>();
  values.variants.forEach((variant, index) => {
    const path = ["variants", index];
    if (!variant.skuAuto && !variant.sku) {
      ctx.addIssue({ code: "custom", path: [...path, "sku"], message: "PRODUCT_SKU_REQUIRED" });
    }
    const key = comboKey(variant.colorId ?? (variant.color.toLowerCase() || null), variant.size);
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

export const productFormSchema = productFields.superRefine(validateProduct);
export const updateProductSchema = productFields.extend({ productId: z.uuid() }).superRefine(validateProduct);

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductVariantFormValues = ProductFormValues["variants"][number];
