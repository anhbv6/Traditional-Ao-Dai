"use server";

import { type z } from "zod";
import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { recordAudit } from "../../../core/server/audit.server";
import { revalidatePath } from "next/cache";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import {
  getAdminProductDetailQuery,
  getAdminProductItemQuery,
} from "../queries/products.queries";
import {
  bulkSetProductsActiveSchema,
  productFormSchema,
  productIdSchema,
  toggleProductActiveSchema,
  toggleProductCustomFitSchema,
  updateProductSchema,
  type ProductFormValues,
} from "../schemas/products.schemas";
import { buildSku, isProductReadyToActivate as isReadyToActivate, toSlug } from "../utils/products.utils";

async function hasUnreadyProduct(productIds: string[]) {
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { images: true, basePrice: true, variants: { select: { size: true, color: true } } },
  });

  return products.some((p) => !isReadyToActivate({ ...p, basePrice: Number(p.basePrice) }));
}

/** Lỗi trùng khóa unique của Prisma (ở đây chỉ có thể là SKU) */
function isUniqueViolation(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

/** Slug duy nhất: thêm hậu tố -2, -3... nếu tên đã có */
async function resolveUniqueSlug(name: string) {
  const base = toSlug(name) || "san-pham";
  const existing = await prisma.product.findMany({ where: { slug: { startsWith: base } }, select: { slug: true } });
  const taken = new Set(existing.map((p) => p.slug));

  let slug = base;
  for (let suffix = 2; taken.has(slug); suffix += 1) slug = `${base}-${suffix}`;
  return slug;
}

/**
 * Chốt SKU: dòng tự sinh tính lại tại server theo quy tắc (không tin client), trùng thì thêm hậu tố;
 * dòng nhập tay giữ nguyên, trùng toàn hệ thống sẽ bị khóa unique chặn (PRODUCT_SKU_DUPLICATE).
 */
async function resolveVariantSkus({ name, collectionCode, variants }: ProductFormValues) {
  const generated = variants.map((v) =>
    v.skuAuto ? buildSku({ collectionCode, productName: name, color: v.color, size: v.size }) : v.sku
  );
  const existing = await prisma.productVariant.findMany({
    where: { sku: { startsWith: "AD-" }, id: { notIn: variants.flatMap((v) => (v.id ? [v.id] : [])) } },
    select: { sku: true },
  });
  const taken = new Set([...existing.map((v) => v.sku), ...variants.flatMap((v) => (v.skuAuto ? [] : [v.sku]))]);

  return variants.map((variant, index) => {
    if (!variant.skuAuto) return variant;

    let sku = generated[index];
    for (let suffix = 2; taken.has(sku); suffix += 1) sku = `${generated[index]}-${suffix}`;
    taken.add(sku);
    return { ...variant, sku };
  });
}

/** Bảng size gắn riêng phải cùng nhóm hàng với loại sản phẩm (không gắn bảng áo dài cho guốc) */
async function checkSizeChartGroup(values: ProductFormValues): Promise<string | null> {
  if (!values.sizeChartId) return null;
  const [chart, category] = await Promise.all([
    prisma.sizeChart.findUnique({ where: { id: values.sizeChartId }, select: { group: true } }),
    prisma.category.findUnique({ where: { id: values.categoryId }, select: { group: true } }),
  ]);
  if (!chart) return "SIZE_CHART_NOT_FOUND";
  if (!category) return "PRODUCT_CATEGORY_REQUIRED";
  return chart.group === category.group ? null : "PRODUCT_SIZE_CHART_GROUP_MISMATCH";
}

/** Cột của ProductVariant lấy từ dòng form */
function toVariantData({ sku, size, color, price, useBasePrice, stock }: ProductFormValues["variants"][number]) {
  return { sku, size, color: color || null, price: useBasePrice ? null : price, stock };
}

/** Cột của Product lấy từ form — chuỗi rỗng lưu thành null để storefront không hiện ô trống */
function toProductData(input: ProductFormValues) {
  return {
    name: input.name,
    nameEn: input.nameEn || null,
    categoryId: input.categoryId,
    sizeChartId: input.sizeChartId || null,
    material: input.material || null,
    materialEn: input.materialEn || null,
    description: input.description || null,
    descriptionEn: input.descriptionEn || null,
    basePrice: input.basePrice,
    images: input.images,
    isActive: input.isActive,
    isCustomFit: input.isCustomFit,
    isFeatured: input.isFeatured,
  };
}

/**
 * Server Action: Lấy chi tiết sản phẩm cho dialog xem/sửa
 */
export async function getProductDetailAction(productId: string) {
  const auth = await authorizeAdminAction({ permission: "MANAGE_INVENTORY" });
  if (!auth.success) return auth;

  const input = parseActionInput(productIdSchema, { productId });
  if (!input.success) return input;

  try {
    const product = await getAdminProductDetailQuery(productId);
    if (!product) return { success: false, error: "PRODUCT_NOT_FOUND" };

    return { success: true, data: product };
  } catch (error) {
    console.error("Lỗi getProductDetailAction:", error);
    return { success: false, error: "PRODUCT_DETAIL_LOAD_FAILED" };
  }
}

/**
 * Server Action: Thêm sản phẩm mới kèm các SKU
 */
export async function createProductAction(raw: z.input<typeof productFormSchema>) {
  const auth = await authorizeAdminAction({ permission: "MANAGE_INVENTORY" });
  if (!auth.success) return auth;

  const input = parseActionInput(productFormSchema, raw);
  if (!input.success) return input;

  const values = input.data;
  if (values.isActive && !isReadyToActivate(values)) {
    return { success: false, error: "PRODUCT_NOT_READY_TO_ACTIVATE" };
  }

  try {
    const slug = await resolveUniqueSlug(values.name);
    const sizeChartError = await checkSizeChartGroup(values);
    if (sizeChartError) return { success: false, error: sizeChartError };
    const variants = await resolveVariantSkus(values);

    const created = await prisma.product.create({
      data: { ...toProductData(values), slug, variants: { create: variants.map(toVariantData) } },
      select: { id: true },
    });

    await recordAudit({
      actorId: auth.user.id,
      action: "PRODUCT_CREATED",
      targetType: "PRODUCT",
      targetId: created.id,
      metadata: { name: values.name, slug, basePrice: values.basePrice, variants: variants.length },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory/skus");

    return { success: true, data: await getAdminProductItemQuery(created.id) };
  } catch (error) {
    if (isUniqueViolation(error)) return { success: false, error: "PRODUCT_SKU_DUPLICATE" };
    console.error("Lỗi createProductAction:", error);
    return { success: false, error: "PRODUCT_CREATE_FAILED" };
  }
}

/**
 * Server Action: Sửa sản phẩm. Slug giữ nguyên để không làm hỏng link đã chia sẻ;
 * SKU đã có đơn hoặc đang trong giỏ không được xóa.
 */
export async function updateProductAction(raw: z.input<typeof updateProductSchema>) {
  const auth = await authorizeAdminAction({ permission: "MANAGE_INVENTORY" });
  if (!auth.success) return auth;

  const input = parseActionInput(updateProductSchema, raw);
  if (!input.success) return input;

  const { productId, ...values } = input.data;
  if (values.isActive && !isReadyToActivate(values)) {
    return { success: false, error: "PRODUCT_NOT_READY_TO_ACTIVATE" };
  }

  try {
    const existing = await prisma.product.findUnique({
      where: { id: productId },
      include: { variants: { include: { _count: { select: { orderItems: true, cartItems: true } } } } },
    });
    if (!existing) return { success: false, error: "PRODUCT_NOT_FOUND" };

    // id biến thể đến từ client: chỉ chấp nhận SKU thuộc đúng sản phẩm này
    const ownedIds = new Set(existing.variants.map((v) => v.id));
    if (values.variants.some((v) => v.id && !ownedIds.has(v.id))) {
      return { success: false, error: "VALIDATION_ERROR" };
    }

    const keptIds = new Set(values.variants.flatMap((v) => (v.id ? [v.id] : [])));
    const removed = existing.variants.filter((v) => !keptIds.has(v.id));
    if (removed.some((v) => v._count.orderItems > 0 || v._count.cartItems > 0)) {
      return { success: false, error: "PRODUCT_VARIANT_IN_USE" };
    }

    const sizeChartError = await checkSizeChartGroup(values);
    if (sizeChartError) return { success: false, error: sizeChartError };
    const variants = await resolveVariantSkus(values);

    await prisma.$transaction(async (tx) => {
      await tx.product.update({ where: { id: productId }, data: toProductData(values) });
      await tx.productVariant.deleteMany({ where: { id: { in: removed.map((v) => v.id) } } });

      for (const variant of variants) {
        const data = toVariantData(variant);
        if (variant.id) await tx.productVariant.update({ where: { id: variant.id }, data });
        else await tx.productVariant.create({ data: { ...data, productId } });
      }
    });

    const before = {
      name: existing.name,
      basePrice: Number(existing.basePrice),
      categoryId: existing.categoryId,
      isActive: existing.isActive,
      isCustomFit: existing.isCustomFit,
      isFeatured: existing.isFeatured,
      imageCount: existing.images.length,
      totalStock: existing.variants.reduce((sum, v) => sum + v.stock, 0),
    };
    const after = {
      name: values.name,
      basePrice: values.basePrice,
      categoryId: values.categoryId,
      isActive: values.isActive,
      isCustomFit: values.isCustomFit,
      isFeatured: values.isFeatured,
      imageCount: values.images.length,
      totalStock: variants.reduce((sum, v) => sum + v.stock, 0),
    };

    await recordAudit({
      actorId: auth.user.id,
      action: "PRODUCT_UPDATED",
      targetType: "PRODUCT",
      targetId: productId,
      metadata: { before, after, removedSkus: removed.map((v) => v.sku) },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory/skus");

    return { success: true, data: await getAdminProductItemQuery(productId) };
  } catch (error) {
    if (isUniqueViolation(error)) return { success: false, error: "PRODUCT_SKU_DUPLICATE" };
    console.error("Lỗi updateProductAction:", error);
    return { success: false, error: "PRODUCT_UPDATE_FAILED" };
  }
}

/**
 * Server Action: Bật/Tắt trạng thái hoạt động của sản phẩm
 */
export async function toggleProductActiveAction(productId: string, isActive: boolean) {
  const auth = await authorizeAdminAction({ permission: "MANAGE_INVENTORY" });
  if (!auth.success) return auth;

  const input = parseActionInput(toggleProductActiveSchema, { productId, isActive });
  if (!input.success) return input;

  try {
    if (isActive && (await hasUnreadyProduct([productId]))) {
      return { success: false, error: "PRODUCT_NOT_READY_TO_ACTIVATE" };
    }

    await prisma.product.update({ where: { id: productId }, data: { isActive } });
    await recordAudit({
      actorId: auth.user.id,
      action: "PRODUCT_VISIBILITY_UPDATED",
      targetType: "PRODUCT",
      targetId: productId,
      metadata: { isActive },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory/skus");

    return { success: true, data: { id: productId, isActive } };
  } catch (error) {
    console.error("Lỗi toggleProductActiveAction:", error);
    return {
      success: false,
      error: "PRODUCT_UPDATE_FAILED",
    };
  }
}

/**
 * Server Action: Ẩn hoặc mở bán nhiều sản phẩm cùng lúc (VD: ẩn cả bộ sưu tập theo mùa)
 */
export async function bulkSetProductsActiveAction(raw: z.input<typeof bulkSetProductsActiveSchema>) {
  const auth = await authorizeAdminAction({ permission: "MANAGE_INVENTORY" });
  if (!auth.success) return auth;

  const input = parseActionInput(bulkSetProductsActiveSchema, raw);
  if (!input.success) return input;

  const { productIds, isActive } = input.data;

  try {
    if (isActive && (await hasUnreadyProduct(productIds))) {
      return { success: false, error: "PRODUCT_NOT_READY_TO_ACTIVATE" };
    }

    const { count } = await prisma.product.updateMany({ where: { id: { in: productIds } }, data: { isActive } });
    await recordAudit({
      actorId: auth.user.id,
      action: "PRODUCTS_VISIBILITY_BULK_UPDATED",
      targetType: "PRODUCT",
      metadata: { productIds, isActive, count },
    });

    revalidatePath("/admin/products");
    revalidatePath("/admin/inventory/skus");

    return { success: true, data: { count } };
  } catch (error) {
    console.error("Lỗi bulkSetProductsActiveAction:", error);
    return {
      success: false,
      error: "PRODUCT_UPDATE_FAILED",
    };
  }
}

/**
 * Server Action: Bật/Tắt tính năng may đo riêng (Custom Fit)
 */
export async function toggleProductCustomFitAction(productId: string, isCustomFit: boolean) {
  const auth = await authorizeAdminAction({ permission: "MANAGE_INVENTORY" });
  if (!auth.success) return auth;

  const input = parseActionInput(toggleProductCustomFitSchema, { productId, isCustomFit });
  if (!input.success) return input;

  try {
    await prisma.product.update({ where: { id: productId }, data: { isCustomFit } });
    await recordAudit({
      actorId: auth.user.id,
      action: "PRODUCT_CUSTOM_FIT_UPDATED",
      targetType: "PRODUCT",
      targetId: productId,
      metadata: { isCustomFit },
    });

    revalidatePath("/admin/products");

    return { success: true, data: { id: productId, isCustomFit } };
  } catch (error) {
    console.error("Lỗi toggleProductCustomFitAction:", error);
    return {
      success: false,
      error: "PRODUCT_UPDATE_FAILED",
    };
  }
}
