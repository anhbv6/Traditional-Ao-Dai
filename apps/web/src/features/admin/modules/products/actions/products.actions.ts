"use server";

import { type z } from "zod";
import { revalidatePath } from "next/cache";
import { PRODUCT_GROUP_TRAITS, type ProductGroup } from "@repo/shared/sizing";
import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { recordAudit } from "../../../core/server/audit.server";
import { ADMIN_MODULE_ACCESS } from "../../../core/session/permissions";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { getAdminProductDetailQuery, getAdminProductItemQuery } from "../queries/products.queries";
import {
  bulkSetProductsActiveSchema,
  createProductSchema,
  toggleProductActiveSchema,
  toggleProductCustomFitSchema,
  updateProductSchema,
  type ProductFormValues,
} from "../schemas/products.schemas";
import { isProductReadyToActivate, toSlug } from "../utils/products.utils";
import {
  CUSTOM_SIZE,
  FREE_SIZE,
  PRODUCT_CODE_PREFIX,
  allowedSaleModes,
  buildVariantSku,
  groupAllowsCustom,
  type SaleMode,
} from "../utils/saleModes";

const ACCESS = ADMIN_MODULE_ACCESS.products;
const DESIGN_GROUPS = ["NECKLINE", "SLEEVE", "PATTERN_TECHNIQUE", "FLAP_LENGTH", "OCCASION"] as const;

function revalidateProducts(productId?: string) {
  revalidatePath("/admin/products");
  if (productId) revalidatePath(`/admin/products/${productId}`);
  revalidatePath("/admin/inventory/skus");
}

/** Lỗi trùng khóa unique của Prisma (mã sản phẩm, slug hoặc SKU) */
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

/** Mã sản phẩm kế tiếp của nhóm hàng: tiền tố + số thứ tự 4 chữ số (AD0001, AD0002...) */
async function nextProductCode(group: ProductGroup) {
  const prefix = PRODUCT_CODE_PREFIX[group];
  const codes = await prisma.product.findMany({ where: { code: { startsWith: prefix } }, select: { code: true } });
  const max = codes.reduce((top, { code }) => {
    const n = Number(code.slice(prefix.length));
    return Number.isInteger(n) && n > top ? n : top;
  }, 0);
  return `${prefix}${String(max + 1).padStart(4, "0")}`;
}

/** Bộ áo dài mặc định gồm áo + quần — admin sửa lại được */
const DEFAULT_SET_ITEMS: Partial<Record<ProductGroup, { label: string; labelEn: string }[]>> = {
  AO_DAI: [
    { label: "Áo dài", labelEn: "Áo dài top" },
    { label: "Quần", labelEn: "Pants" },
  ],
};

/**
 * Server Action: tạo nhanh sản phẩm (tên + loại + hình thức bán) ở trạng thái ẩn, sinh mã sản phẩm;
 * giá, ảnh, SKU... nhập ở màn chi tiết
 */
export async function createProductAction(raw: z.input<typeof createProductSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(createProductSchema, raw);
  if (!input.success) return input;
  const { name, categoryId, saleMode } = input.data;

  try {
    const category = await prisma.category.findUnique({ where: { id: categoryId }, select: { group: true } });
    if (!category) return { success: false as const, error: "PRODUCT_CATEGORY_REQUIRED" };
    if (!allowedSaleModes(category.group).includes(saleMode)) {
      return { success: false as const, error: "PRODUCT_SALE_MODE_NOT_ALLOWED" };
    }

    const slug = await resolveUniqueSlug(name);
    const setItems =
      saleMode === "SET"
        ? (DEFAULT_SET_ITEMS[category.group] ?? []).map((item) => ({ ...item, quantity: 1, materialId: null }))
        : [];

    // Hai người tạo cùng lúc có thể lấy trùng số — thử lại với số kế tiếp
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const code = await nextProductCode(category.group);
      try {
        const created = await prisma.product.create({
          data: {
            code,
            name,
            slug,
            categoryId,
            saleMode,
            setItems,
            basePrice: 0,
            isActive: false,
            isCustomFit: saleMode === "CUSTOM",
          },
          select: { id: true },
        });
        await recordAudit({
          actorId: auth.user.id,
          action: "PRODUCT_CREATED",
          targetType: "PRODUCT",
          targetId: created.id,
          metadata: { code, name, saleMode },
        });
        revalidateProducts();
        return { success: true as const, data: { id: created.id } };
      } catch (error) {
        if (!isUniqueViolation(error) || attempt === 2) throw error;
      }
    }
    return { success: false as const, error: "PRODUCT_CREATE_FAILED" };
  } catch (error) {
    console.error("Lỗi createProductAction:", error);
    return { success: false as const, error: "PRODUCT_CREATE_FAILED" };
  }
}

/** Ràng buộc kế thừa từ danh mục: hình thức bán, may đo, bảng size, size của SKU theo nhóm hàng */
function checkInheritedRules(values: ProductFormValues, group: ProductGroup): string | null {
  if (!allowedSaleModes(group).includes(values.saleMode)) return "PRODUCT_SALE_MODE_NOT_ALLOWED";
  if (values.isCustomFit && !groupAllowsCustom(group)) return "PRODUCT_CUSTOM_FIT_NOT_ALLOWED";
  const sizeless = PRODUCT_GROUP_TRAITS[group].sizing === "NONE";
  for (const variant of values.variants) {
    if (values.saleMode === "CUSTOM" && variant.size !== CUSTOM_SIZE) return "PRODUCT_SIZE_INVALID";
    if (values.saleMode !== "CUSTOM" && variant.size === CUSTOM_SIZE) return "PRODUCT_SIZE_INVALID";
    if (values.saleMode !== "CUSTOM" && sizeless && variant.size !== FREE_SIZE) return "PRODUCT_SIZE_INVALID";
  }
  return null;
}

/**
 * Chốt SKU: dòng tự sinh tính lại tại server theo quy tắc <mã SP>-<màu>-<size> (không tin client),
 * trùng thì thêm hậu tố; dòng nhập tay giữ nguyên, trùng toàn hệ thống bị khóa unique chặn
 */
async function resolveVariantSkus(
  productCode: string,
  variants: ProductFormValues["variants"],
  colorCodes: Map<string, string>
) {
  const ownIds = variants.flatMap((v) => (v.id ? [v.id] : []));
  const existing = await prisma.productVariant.findMany({
    where: { sku: { startsWith: productCode }, id: { notIn: ownIds } },
    select: { sku: true },
  });
  const taken = new Set([...existing.map((v) => v.sku), ...variants.flatMap((v) => (v.skuAuto ? [] : [v.sku]))]);

  return variants.map((variant) => {
    if (!variant.skuAuto) return variant;
    const colorCode = variant.colorId ? (colorCodes.get(variant.colorId) ?? null) : variant.color || null;
    const base = buildVariantSku({ productCode, colorCode, size: variant.size });
    let sku = base;
    for (let suffix = 2; taken.has(sku); suffix += 1) sku = `${base}-${suffix}`;
    taken.add(sku);
    return { ...variant, sku };
  });
}

/**
 * Server Action: lưu toàn bộ sản phẩm từ màn chi tiết. Slug và mã sản phẩm giữ nguyên để không làm hỏng link
 * và SKU đã in tem; SKU đã có đơn hoặc đang trong giỏ không được xóa.
 */
export async function updateProductAction(raw: z.input<typeof updateProductSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(updateProductSchema, raw);
  if (!input.success) return input;
  const { productId, ...values } = input.data;

  try {
    const [existing, category] = await Promise.all([
      prisma.product.findUnique({
        where: { id: productId },
        include: { variants: { include: { _count: { select: { orderItems: true, cartItems: true } } } } },
      }),
      prisma.category.findUnique({ where: { id: values.categoryId }, select: { group: true } }),
    ]);
    if (!existing) return { success: false as const, error: "PRODUCT_NOT_FOUND" };
    if (!category) return { success: false as const, error: "PRODUCT_CATEGORY_REQUIRED" };

    // May đo luôn nhận số đo; hình thức khác chỉ khi nhóm hàng cho phép
    const normalized: ProductFormValues = {
      ...values,
      isCustomFit: values.saleMode === "CUSTOM" || values.isCustomFit,
      setItems: values.saleMode === "SET" ? values.setItems : [],
      leadTimeDays: values.saleMode === "CUSTOM" || values.isCustomFit ? values.leadTimeDays : null,
      // May đo không giữ thành phẩm trong kho
      variants: values.saleMode === "CUSTOM" ? values.variants.map((v) => ({ ...v, stock: 0 })) : values.variants,
    };
    const ruleError = checkInheritedRules(normalized, category.group);
    if (ruleError) return { success: false as const, error: ruleError };
    if (normalized.isActive && !isProductReadyToActivate({ ...normalized, setItemCount: normalized.setItems.length })) {
      return { success: false as const, error: "PRODUCT_NOT_READY_TO_ACTIVATE" };
    }

    // Tham chiếu từ client phải đúng loại: bảng size cùng nhóm hàng, màu là thuộc tính màu, đặc tính là thuộc tính thiết kế
    const materialIds = [normalized.materialId, ...normalized.setItems.map((item) => item.materialId)].filter(
      (id): id is string => Boolean(id)
    );
    const colorIds = [...new Set(normalized.variants.flatMap((v) => (v.colorId ? [v.colorId] : [])))];
    const [chart, materialCount, colors, designCount] = await Promise.all([
      normalized.sizeChartId
        ? prisma.sizeChart.findUnique({ where: { id: normalized.sizeChartId }, select: { group: true } })
        : null,
      prisma.material.count({ where: { id: { in: [...new Set(materialIds)] } } }),
      prisma.attributeValue.findMany({ where: { id: { in: colorIds }, group: "COLOR" }, select: { id: true, code: true, name: true } }),
      prisma.attributeValue.count({ where: { id: { in: normalized.attributeIds }, group: { in: [...DESIGN_GROUPS] } } }),
    ]);
    if (normalized.sizeChartId && (!chart || chart.group !== category.group)) {
      return { success: false as const, error: "PRODUCT_SIZE_CHART_GROUP_MISMATCH" };
    }
    if (materialCount !== new Set(materialIds).size) return { success: false as const, error: "MATERIAL_NOT_FOUND" };
    if (colors.length !== colorIds.length || designCount !== normalized.attributeIds.length) {
      return { success: false as const, error: "ATTRIBUTE_NOT_FOUND" };
    }

    // id biến thể đến từ client: chỉ chấp nhận SKU thuộc đúng sản phẩm này
    const ownedIds = new Set(existing.variants.map((v) => v.id));
    if (normalized.variants.some((v) => v.id && !ownedIds.has(v.id))) {
      return { success: false as const, error: "VALIDATION_ERROR" };
    }
    const keptIds = new Set(normalized.variants.flatMap((v) => (v.id ? [v.id] : [])));
    const removed = existing.variants.filter((v) => !keptIds.has(v.id));
    if (removed.some((v) => v._count.orderItems > 0 || v._count.cartItems > 0)) {
      return { success: false as const, error: "PRODUCT_VARIANT_IN_USE" };
    }

    const colorById = new Map(colors.map((c) => [c.id, c]));
    const variants = await resolveVariantSkus(
      existing.code,
      normalized.variants,
      new Map(colors.map((c) => [c.id, c.code]))
    );

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: productId },
        data: {
          name: normalized.name,
          nameEn: normalized.nameEn || null,
          description: normalized.description || null,
          descriptionEn: normalized.descriptionEn || null,
          categoryId: normalized.categoryId,
          saleMode: normalized.saleMode,
          setItems: normalized.setItems,
          leadTimeDays: normalized.leadTimeDays,
          materialId: normalized.materialId,
          sizeChartId: normalized.sizeChartId || null,
          basePrice: normalized.basePrice,
          images: normalized.images,
          isActive: normalized.isActive,
          isCustomFit: normalized.isCustomFit,
          isFeatured: normalized.isFeatured,
        },
      });
      await tx.productAttribute.deleteMany({ where: { productId } });
      if (normalized.attributeIds.length > 0) {
        await tx.productAttribute.createMany({
          data: normalized.attributeIds.map((attributeValueId) => ({ productId, attributeValueId })),
        });
      }
      await tx.productVariant.deleteMany({ where: { id: { in: removed.map((v) => v.id) } } });
      for (const variant of variants) {
        // Tên màu lưu kèm để SKU vẫn đọc được nếu thuộc tính màu bị xóa
        const colorName = variant.colorId ? (colorById.get(variant.colorId)?.name ?? null) : variant.color || null;
        const data = {
          sku: variant.sku,
          size: variant.size,
          colorId: variant.colorId,
          color: colorName,
          price: variant.price,
          stock: variant.stock,
        };
        if (variant.id) await tx.productVariant.update({ where: { id: variant.id }, data });
        else await tx.productVariant.create({ data: { ...data, productId } });
      }
    });

    await recordAudit({
      actorId: auth.user.id,
      action: "PRODUCT_UPDATED",
      targetType: "PRODUCT",
      targetId: productId,
      metadata: {
        before: {
          name: existing.name,
          saleMode: existing.saleMode,
          basePrice: Number(existing.basePrice),
          isActive: existing.isActive,
          skus: existing.variants.length,
        },
        after: {
          name: normalized.name,
          saleMode: normalized.saleMode,
          basePrice: normalized.basePrice,
          isActive: normalized.isActive,
          skus: variants.length,
        },
        removedSkus: removed.map((v) => v.sku),
      },
    });
    revalidateProducts(productId);

    const detail = await getAdminProductDetailQuery(productId);
    if (!detail) return { success: false as const, error: "PRODUCT_NOT_FOUND" };
    return { success: true as const, data: detail };
  } catch (error) {
    if (isUniqueViolation(error)) return { success: false as const, error: "PRODUCT_SKU_DUPLICATE" };
    console.error("Lỗi updateProductAction:", error);
    return { success: false as const, error: "PRODUCT_UPDATE_FAILED" };
  }
}

/** Sản phẩm trong danh sách có cái nào chưa đủ điều kiện mở bán */
async function hasUnreadyProduct(productIds: string[]) {
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { images: true, basePrice: true, saleMode: true, setItems: true, variants: { select: { size: true, color: true } } },
  });
  return products.some(
    (p) =>
      !isProductReadyToActivate({
        images: p.images,
        basePrice: Number(p.basePrice),
        variants: p.variants,
        saleMode: p.saleMode,
        setItemCount: Array.isArray(p.setItems) ? p.setItems.length : 0,
      })
  );
}

/** Server Action: bật / tắt mở bán một sản phẩm */
export async function toggleProductActiveAction(productId: string, isActive: boolean) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(toggleProductActiveSchema, { productId, isActive });
  if (!input.success) return input;

  try {
    if (isActive && (await hasUnreadyProduct([productId]))) {
      return { success: false as const, error: "PRODUCT_NOT_READY_TO_ACTIVATE" };
    }
    await prisma.product.update({ where: { id: productId }, data: { isActive } });
    await recordAudit({
      actorId: auth.user.id,
      action: "PRODUCT_VISIBILITY_UPDATED",
      targetType: "PRODUCT",
      targetId: productId,
      metadata: { isActive },
    });
    revalidateProducts(productId);
    return { success: true as const, data: await getAdminProductItemQuery(productId) };
  } catch (error) {
    console.error("Lỗi toggleProductActiveAction:", error);
    return { success: false as const, error: "PRODUCT_UPDATE_FAILED" };
  }
}

/** Server Action: ẩn hoặc mở bán nhiều sản phẩm cùng lúc (VD ẩn cả bộ sưu tập theo mùa) */
export async function bulkSetProductsActiveAction(raw: z.input<typeof bulkSetProductsActiveSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(bulkSetProductsActiveSchema, raw);
  if (!input.success) return input;
  const { productIds, isActive } = input.data;

  try {
    if (isActive && (await hasUnreadyProduct(productIds))) {
      return { success: false as const, error: "PRODUCT_NOT_READY_TO_ACTIVATE" };
    }
    const { count } = await prisma.product.updateMany({ where: { id: { in: productIds } }, data: { isActive } });
    await recordAudit({
      actorId: auth.user.id,
      action: "PRODUCTS_VISIBILITY_BULK_UPDATED",
      targetType: "PRODUCT",
      metadata: { productIds, isActive, count },
    });
    revalidateProducts();
    return { success: true as const, data: { count } };
  } catch (error) {
    console.error("Lỗi bulkSetProductsActiveAction:", error);
    return { success: false as const, error: "PRODUCT_UPDATE_FAILED" };
  }
}

/** Server Action: bật / tắt nhận may đo cho sản phẩm may sẵn — chỉ nhóm hàng có may đo, may đo thì luôn bật */
export async function toggleProductCustomFitAction(productId: string, isCustomFit: boolean) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;
  const input = parseActionInput(toggleProductCustomFitSchema, { productId, isCustomFit });
  if (!input.success) return input;

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { saleMode: true, category: { select: { group: true } } },
    });
    if (!product) return { success: false as const, error: "PRODUCT_NOT_FOUND" };
    const mode: SaleMode = product.saleMode;
    if (mode === "CUSTOM" || (isCustomFit && !groupAllowsCustom(product.category.group))) {
      return { success: false as const, error: "PRODUCT_CUSTOM_FIT_NOT_ALLOWED" };
    }

    await prisma.product.update({ where: { id: productId }, data: { isCustomFit } });
    await recordAudit({
      actorId: auth.user.id,
      action: "PRODUCT_CUSTOM_FIT_UPDATED",
      targetType: "PRODUCT",
      targetId: productId,
      metadata: { isCustomFit },
    });
    revalidateProducts(productId);
    return { success: true as const, data: await getAdminProductItemQuery(productId) };
  } catch (error) {
    console.error("Lỗi toggleProductCustomFitAction:", error);
    return { success: false as const, error: "PRODUCT_UPDATE_FAILED" };
  }
}
