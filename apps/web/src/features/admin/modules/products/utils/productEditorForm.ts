import { type ProductFormValues, type ProductVariantFormValues } from "../schemas/products.schemas";
import { type AdminProductDetail } from "../types/products.types";

/** Một dòng SKU trong form: thêm khóa React và cờ "đã có đơn" (không gửi lên server) */
export type VariantRow = Omit<ProductVariantFormValues, "id"> & { id?: string; key: string; inUse: boolean };

export type ProductFormState = Omit<ProductFormValues, "variants"> & { variants: VariantRow[] };

/** Dữ liệu chi tiết → trạng thái form. SKU đã lưu không tự sinh lại (giữ mã đã in tem) */
export function toFormState(product: AdminProductDetail): ProductFormState {
  return {
    name: product.name,
    nameEn: product.nameEn ?? "",
    description: product.description ?? "",
    descriptionEn: product.descriptionEn ?? "",
    categoryId: product.categoryId,
    saleMode: product.saleMode,
    setItems: product.setItems,
    leadTimeDays: product.leadTimeDays,
    materialId: product.materialId,
    sizeChartId: product.sizeChartId ?? "",
    basePrice: product.basePrice,
    images: product.images,
    attributeIds: product.attributeIds,
    isActive: product.isActive,
    isCustomFit: product.isCustomFit,
    isFeatured: product.isFeatured,
    variants: product.variants.map((v) => ({
      id: v.id,
      key: v.id,
      skuAuto: false,
      sku: v.sku,
      size: v.size,
      colorId: v.colorId,
      color: v.color ?? "",
      price: v.price,
      stock: v.stock,
      inUse: v.inUse,
    })),
  };
}

/** Trạng thái form → tham số Server Action (bỏ trường chỉ dùng ở client) */
export function toPayload(state: ProductFormState): ProductFormValues {
  return {
    ...state,
    variants: state.variants.map(({ key: _key, inUse: _inUse, ...variant }) => variant),
  };
}
