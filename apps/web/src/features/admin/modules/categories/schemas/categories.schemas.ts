import { z } from "zod";
import { PRODUCT_GROUPS } from "@repo/shared/sizing";
import { sizeChartGridSchema } from "@/features/admin/modules/size-charts";

const categoryFields = z.object({
  name: z.string().trim().min(1, "CATEGORY_NAME_REQUIRED").max(120),
  nameEn: z.string().trim().max(120),
  slug: z
    .string()
    .trim()
    .regex(/^([a-z0-9]+(-[a-z0-9]+)*)?$/, "CATEGORY_SLUG_INVALID")
    .max(120),
  description: z.string().trim().max(1000),
  descriptionEn: z.string().trim().max(1000),
  group: z.enum(PRODUCT_GROUPS),
  isActive: z.boolean(),
  defaultSizeChartId: z.uuid().or(z.literal("")),
  /** null = nhóm gốc (chỉ khi sửa nhóm gốc có sẵn) */
  parentId: z.uuid().nullable(),
});

/** Cách gắn bảng size cho loại sản phẩm (thêm / sửa): tự nhập bảng riêng hoặc dùng bảng size mẫu có sẵn */
export const SIZE_CHART_MODES = ["custom", "preset"] as const;
export type SizeChartMode = (typeof SIZE_CHART_MODES)[number];

const sizeChartFields = {
  sizeChartMode: z.enum(SIZE_CHART_MODES),
  /**
   * Bảng size nhập ngay trong dialog khi `sizeChartMode = "custom"` (nhóm hàng có size).
   * Khi sửa: null = giữ nguyên bảng đang gắn.
   */
  sizeChart: sizeChartGridSchema.nullable(),
};

/** Chỉ thêm LOẠI SẢN PHẨM — nhóm gốc cố định theo nhóm hàng, không tạo từ giao diện */
export const createCategorySchema = categoryFields.extend({
  parentId: z.uuid("CATEGORY_PARENT_REQUIRED"),
  ...sizeChartFields,
});
/** Sửa nhóm gốc (chỉ tên, mô tả, hiển thị — không có bảng size) hoặc loại sản phẩm */
export const updateCategorySchema = categoryFields.extend({ categoryId: z.uuid(), ...sizeChartFields });

export const reorderCategoriesSchema = z.object({
  parentId: z.uuid().nullable(),
  orderedIds: z.array(z.uuid()).min(1).max(200),
});

export const categoryIdSchema = z.object({ categoryId: z.uuid() });

export type CategoryFormValues = z.infer<typeof categoryFields>;
