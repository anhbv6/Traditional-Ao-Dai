"use server";

import { type z } from "zod";
import { revalidatePath } from "next/cache";
import { type Prisma } from "@repo/db";
import { formatVnd, toVnd, type Locale } from "@repo/shared";
import { PRODUCT_GROUP_TRAITS, type ProductGroup } from "@repo/shared/sizing";
import { type DisplayProduct, productCatalog } from "@/features/products";
import { type SizeChartColumnValue, type SizeChartRowValue } from "@/features/admin/modules/size-charts";
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
/** Nhóm tạo biến thể SKU — mọi nhóm khác (có sẵn hoặc admin thêm) là đặc tính thiết kế */
const VARIANT_GROUP_CODES = ["COLOR", "SIZE"];

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
      prisma.attributeValue.findMany({
        where: { id: { in: colorIds }, group: { code: "COLOR" } },
        select: { id: true, code: true, name: true },
      }),
      prisma.attributeValue.count({
        where: { id: { in: normalized.attributeIds }, group: { code: { notIn: VARIANT_GROUP_CODES } } },
      }),
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
    select: {
      images: true,
      basePrice: true,
      saleMode: true,
      setItems: true,
      variants: { select: { size: true, color: true } },
    },
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

/** Server Action: tạo bảng size mới trực tiếp từ màn soạn sản phẩm (tự tạo bảng size mẫu / bảng riêng) */
export async function createProductSizeChartAction(raw: {
  name: string;
  nameEn?: string;
  group: ProductGroup;
  grid: {
    columns: SizeChartColumnValue[];
    rows: SizeChartRowValue[];
  };
}) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const { name, nameEn, group, grid } = raw;
  if (!name.trim()) {
    return { success: false as const, error: "VALIDATION_ERROR" };
  }
  if (!grid.columns.length || !grid.rows.length) {
    return { success: false as const, error: "VALIDATION_ERROR" };
  }

  try {
    const columnKeys = new Set<string>(grid.columns.map((column) => column.key));
    const columns = grid.columns.map((column, position) => ({
      key: column.key,
      position,
      validMin: column.validMin ?? null,
      validMax: column.validMax ?? null,
      bigsizeFrom: column.bigsizeFrom ?? null,
    }));
    const rows = grid.rows.map((row, position) => ({
      sizeLabel: row.sizeLabel.trim(),
      position,
      values: Object.fromEntries(
        Object.entries(row.values).filter(([key]) => columnKeys.has(key))
      ) as unknown as Prisma.InputJsonObject,
    }));

    const created = await prisma.sizeChart.create({
      data: {
        name: name.trim(),
        nameEn: nameEn?.trim() || null,
        group,
        isActive: true,
        columns: { create: columns },
        rows: { create: rows },
      },
      select: {
        id: true,
        name: true,
        group: true,
        isActive: true,
        rows: { select: { sizeLabel: true }, orderBy: { position: "asc" } },
      },
    });

    await recordAudit({
      actorId: auth.user.id,
      action: "SIZE_CHART_CREATED",
      targetType: "SIZE_CHART",
      targetId: created.id,
      metadata: { name: created.name, group: created.group, source: "PRODUCT_EDITOR" },
    });

    revalidatePath("/admin/catalog/size-charts");
    revalidatePath("/admin/products");

    return {
      success: true as const,
      data: {
        id: created.id,
        name: created.name,
        group: created.group,
        isActive: created.isActive,
        sizeLabels: created.rows.map((r) => r.sizeLabel),
      },
    };
  } catch (error) {
    console.error("Lỗi createProductSizeChartAction:", error);
    return { success: false as const, error: "SIZE_CHART_CREATE_FAILED" };
  }
}

const PREVIEW_PRODUCT_INCLUDE = {
  category: { select: { id: true, name: true, nameEn: true, group: true } },
  material: { select: { id: true, name: true, nameEn: true } },
  variants: {
    select: {
      id: true,
      sku: true,
      size: true,
      color: true,
      colorId: true,
      price: true,
      stock: true,
      colorValue: {
        select: { id: true, code: true, name: true, nameEn: true, hex: true },
      },
    },
    orderBy: { createdAt: "asc" },
  },
  attributes: {
    include: {
      attributeValue: {
        select: { id: true, code: true, name: true, nameEn: true, hex: true, group: { select: { code: true } } },
      },
    },
  },
  reviews: { select: { rating: true } },
} satisfies Prisma.ProductInclude;

type ProductWithPreviewPayload = Prisma.ProductGetPayload<{ include: typeof PREVIEW_PRODUCT_INCLUDE }>;

function formatProductForPreview(product: ProductWithPreviewPayload, locale: Locale = "vi"): DisplayProduct {
  const basePriceVnd = toVnd(product.basePrice);
  const priceFormatted = formatVnd(basePriceVnd, locale);

  const matchedCatalog = productCatalog.find(
    (item) => item.id === product.code || item.id === product.slug || item.id === product.id
  );

  const images =
    product.images.length > 0
      ? product.images
      : matchedCatalog?.imageSrc
        ? ([matchedCatalog.imageSrc, matchedCatalog.hoverImageSrc].filter(Boolean) as string[])
        : ["/images/placeholder.jpg"];

  const sizes = Array.from(new Set(product.variants.map((v) => v.size).filter(Boolean)));
  const finalSizes =
    sizes.length > 0
      ? sizes
      : matchedCatalog?.sizes && matchedCatalog.sizes.length > 0
        ? matchedCatalog.sizes
        : ["S", "M", "L", "Free-size"];

  // Gom các màu sắc thực tế từ biến thể sản phẩm trong DB (ưu tiên hex và name chuẩn của colorValue)
  const colorMap = new Map<string, { name: string; hex: string; imageSrc?: string }>();
  product.variants.forEach((v, idx) => {
    const colorName = v.colorValue
      ? (locale === "vi" ? v.colorValue.name : v.colorValue.nameEn || v.colorValue.name)
      : v.color;
    if (colorName && !colorMap.has(colorName)) {
      colorMap.set(colorName, {
        name: colorName,
        hex: v.colorValue?.hex || "#E8B4B8",
        imageSrc: images[idx] || images[0],
      });
    }
  });

  // Nếu trong variants chưa có, kiểm tra thuộc tính sản phẩm (nhóm COLOR)
  if (colorMap.size === 0) {
    const colorAttributes = product.attributes
      .map((a) => a.attributeValue)
      .filter((v) => v.group?.code === "COLOR");
    colorAttributes.forEach((attr, idx) => {
      const name = locale === "vi" ? attr.name : attr.nameEn || attr.name;
      if (name && !colorMap.has(name)) {
        colorMap.set(name, {
          name,
          hex: attr.hex || "#E8B4B8",
          imageSrc: images[idx] || images[0],
        });
      }
    });
  }

  let colors = Array.from(colorMap.values());
  if (colors.length === 0) {
    if (matchedCatalog && matchedCatalog.colors && matchedCatalog.colors.length > 0) {
      colors = matchedCatalog.colors.map((c) => ({ name: c.name, hex: c.hex, imageSrc: c.imageSrc }));
    } else {
      colors = [{ name: locale === "vi" ? "Tiêu chuẩn" : "Standard", hex: "#E8B4B8", imageSrc: images[0] }];
    }
  }

  const sizePrices: Record<string, { price: number; originalPrice?: number }> = {};
  product.variants.forEach((v) => {
    if (v.price !== null) {
      sizePrices[v.size] = {
        price: toVnd(v.price),
      };
    }
  });

  const totalStock = product.variants.reduce((sum, v) => sum + v.stock, 0);
  const stockText =
    product.saleMode === 'CUSTOM'
      ? (locale === 'vi' ? 'Đặt may' : 'Made to order')
      : totalStock > 0
        ? (locale === 'vi' ? 'Còn hàng' : 'In Stock')
        : (locale === 'vi' ? 'Hết hàng' : 'Out of Stock');

  const categoryName =
    locale === 'vi' ? product.category.name || product.category.nameEn : product.category.nameEn || product.category.name;
  const materialName =
    locale === 'vi'
      ? product.material?.name || product.material?.nameEn || 'Lụa Tơ Tằm'
      : product.material?.nameEn || product.material?.name || 'Silk';

  const avgRating =
    product.reviews.length > 0
      ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
      : '5.0';

  const reviewCountText =
    product.reviews.length > 0
      ? (locale === 'vi' ? `${product.reviews.length} đánh giá` : `${product.reviews.length} Reviews`)
      : (locale === 'vi' ? '121 đánh giá' : '121 Reviews');

  const desc = locale === 'vi' ? product.description || '' : product.descriptionEn || product.description || '';

  return {
    id: product.code,
    slug: product.slug,
    name: locale === 'vi' ? product.name || product.nameEn || '' : product.nameEn || product.name || '',
    description:
      desc || (locale === 'vi' ? 'Tông màu sang trọng thêu chim phượng cát tường tinh xảo.' : 'Refined traditional Vietnamese design.'),
    longDescription:
      desc ||
      (locale === 'vi'
        ? 'Thiết kế được hoàn thiện với phom dáng mềm mại, chất liệu chọn lọc và các chi tiết tinh tế để phù hợp cho những dịp trang trọng. Sản phẩm giữ nét thanh lịch truyền thống nhưng vẫn dễ phối trong nhịp sống hiện đại.'
        : 'This design is finished with a graceful silhouette, selected fabric, and refined details for formal occasions.'),
    secondaryDescription: '',
    price: priceFormatted,
    priceValue: basePriceVnd,
    originalPrice: undefined,
    sizePrices: Object.keys(sizePrices).length > 0 ? sizePrices : undefined,
    galleryImages: images,
    imageSrc: images[0] || '/images/placeholder.jpg',
    hoverImageSrc: images[1] || images[0] || '/images/placeholder.jpg',
    imageAlt: product.name,
    category: categoryName || 'Áo dài',
    material: materialName,
    purchaseType: product.saleMode === 'CUSTOM' ? 'custom' : product.saleMode === 'SET' ? 'set' : 'ready',
    sizes: finalSizes,
    colors,
    rating: avgRating,
    reviewCount: reviewCountText,
    stock: stockText,
    sku: product.code,
    related: locale === 'vi' ? 'Sản phẩm liên quan' : 'Related Products',
  };
}

/**
 * Server Action: Lấy dữ liệu chi tiết sản phẩm phục vụ hộp thoại xem trước (Preview) ở Admin.
 * Tái sử dụng dữ liệu định dạng DisplayProduct để tương thích trực tiếp với ProductPreviewView.
 */
export async function getProductPreviewAction(productId: string, locale: Locale = 'vi') {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  try {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: PREVIEW_PRODUCT_INCLUDE,
    });

    if (!product) {
      const matchedCatalog = productCatalog.find(
        (item) => item.id === productId || item.id === decodeURIComponent(productId)
      );
      if (matchedCatalog) {
        const display: DisplayProduct = {
          id: matchedCatalog.id,
          slug: matchedCatalog.id,
          name: matchedCatalog.name[locale],
          description: matchedCatalog.description[locale],
          price: matchedCatalog.price[locale],
          priceValue: matchedCatalog.numericPrice,
          originalPrice: matchedCatalog.originalPrice?.[locale],
          galleryImages: Array.from(
            new Set([matchedCatalog.imageSrc, matchedCatalog.hoverImageSrc, ...matchedCatalog.colors.map((c) => c.imageSrc).filter(Boolean)])
          ).filter(Boolean) as string[],
          imageSrc: matchedCatalog.imageSrc,
          hoverImageSrc: matchedCatalog.hoverImageSrc,
          imageAlt: matchedCatalog.imageAlt,
          category: matchedCatalog.category,
          purchaseType: matchedCatalog.purchaseType,
          material: matchedCatalog.material,
          sizes: matchedCatalog.sizes,
          colors: matchedCatalog.colors.map((c) => ({ name: c.name, hex: c.hex, imageSrc: c.imageSrc })),
          longDescription:
            locale === 'vi'
              ? 'Thiết kế được hoàn thiện với phom dáng mềm mại, chất liệu chọn lọc và các chi tiết tinh tế để phù hợp cho những dịp trang trọng. Sản phẩm giữ nét thanh lịch truyền thống nhưng vẫn dễ phối trong nhịp sống hiện đại.'
              : 'This design is finished with a graceful silhouette, selected fabric, and refined details for formal occasions.',
          secondaryDescription: '',
          rating: '5.0',
          reviewCount: locale === 'vi' ? '121 đánh giá' : '121 Reviews',
          stock: locale === 'vi' ? 'Còn hàng' : 'In Stock',
          sku: matchedCatalog.id,
          related: locale === 'vi' ? 'Sản phẩm liên quan' : 'Related Products',
        };
        return { success: true as const, data: display };
      }
      return { success: false as const, error: 'PRODUCT_NOT_FOUND' };
    }

    return {
      success: true as const,
      data: formatProductForPreview(product, locale),
    };
  } catch (error) {
    console.error('Lỗi getProductPreviewAction:', error);
    return { success: false as const, error: 'PRODUCT_QUERY_FAILED' };
  }
}
