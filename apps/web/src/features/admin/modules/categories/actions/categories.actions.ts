"use server";

import { type z } from "zod";
import { type Prisma } from "@repo/db";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { recordAudit } from "../../../core/server/audit.server";
import { ADMIN_MODULE_ACCESS } from "../../../core/session/permissions";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { toSlug } from "@/features/admin/modules/products";
import { PRODUCT_GROUP_TRAITS, type ProductGroup } from "@repo/shared/sizing";
import { rowHasMeasurement } from "@/features/admin/modules/size-charts";
import { getCategoryTreeQuery } from "../queries/categories.queries";
import {
  categoryIdSchema,
  createCategorySchema,
  reorderCategoriesSchema,
  updateCategorySchema,
  type CategoryFormValues,
} from "../schemas/categories.schemas";

const ACCESS = ADMIN_MODULE_ACCESS.categories;

function revalidateCategories() {
  revalidatePath("/admin/catalog/categories");
  revalidatePath("/admin/products");
}

async function resolveUniqueSlug(base: string, excludeId?: string) {
  const root = base || "loai-san-pham";
  const existing = await prisma.category.findMany({
    where: { slug: { startsWith: root }, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { slug: true },
  });
  const taken = new Set(existing.map((c) => c.slug));
  let slug = root;
  for (let suffix = 2; taken.has(slug); suffix += 1) slug = `${root}-${suffix}`;
  return slug;
}

/** Trường form, trừ nhóm cha (truyền riêng — tạo mới luôn có cha, sửa nhóm gốc thì null) */
type CategoryFields = Omit<CategoryFormValues, "parentId">;
type StructureCheck = { error: string } | { group: ProductGroup };

/**
 * Kiểm tra cấu trúc khi thêm / sửa LOẠI SẢN PHẨM:
 * - Nhóm gốc cố định (mỗi nhóm hàng một gốc, tạo sẵn bằng migration / seed) — loại sản phẩm luôn nằm trong một nhóm gốc.
 * - Nhóm hàng (bản chất may đo / đơn vị bán / có size) lấy theo nhóm gốc, bỏ qua giá trị client gửi lên.
 * - Bảng size phải cùng nhóm hàng — bảng size áo dài không gắn được cho quần hay guốc.
 */
async function resolveStructure(values: CategoryFields, parentId: string): Promise<StructureCheck> {
  const parent = await prisma.category.findUnique({ where: { id: parentId }, select: { parentId: true, group: true } });
  if (!parent || parent.parentId !== null) return { error: "CATEGORY_PARENT_INVALID" };
  return checkSizeChart(values.defaultSizeChartId, parent.group);
}

async function checkSizeChart(sizeChartId: string, group: ProductGroup): Promise<StructureCheck> {
  if (sizeChartId) {
    const chart = await prisma.sizeChart.findUnique({ where: { id: sizeChartId }, select: { group: true } });
    if (!chart) return { error: "SIZE_CHART_NOT_FOUND" };
    if (chart.group !== group) return { error: "CATEGORY_SIZE_CHART_GROUP_MISMATCH" };
  }
  return { group };
}

function toCategoryData(values: CategoryFields, group: ProductGroup, parentId: string | null) {
  return {
    name: values.name,
    nameEn: values.nameEn || null,
    description: values.description || null,
    descriptionEn: values.descriptionEn || null,
    group,
    isActive: values.isActive,
    defaultSizeChartId: values.defaultSizeChartId || null,
    parentId,
  };
}

/**
 * Server Action: thêm loại sản phẩm vào một nhóm gốc, xếp cuối danh sách.
 * `sizeChartMode = "custom"` (nhóm hàng có bảng size): tạo bảng size riêng từ lưới admin vừa nhập trong dialog và gắn cho
 * loại. `"preset"`: dùng bảng size mẫu đã chọn (hoặc theo bảng của nhóm gốc).
 */
export async function createCategoryAction(raw: z.input<typeof createCategorySchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(createCategorySchema, raw);
  if (!input.success) return input;
  const { sizeChartMode, sizeChart, parentId, ...values } = input.data;

  try {
    const customChart = sizeChartMode === "custom";
    const structure = await resolveStructure(customChart ? { ...values, defaultSizeChartId: "" } : values, parentId);
    if ("error" in structure) return { success: false as const, error: structure.error };
    const { group } = structure;
    const withChart = customChart && PRODUCT_GROUP_TRAITS[group].sizing !== "NONE";
    // Bảng size riêng phải nhập đủ: có cột, có hàng, hàng nào cũng có số đo
    if (
      withChart &&
      (!sizeChart || sizeChart.columns.length === 0 || sizeChart.rows.length === 0 || !sizeChart.rows.every(rowHasMeasurement))
    ) {
      return { success: false as const, error: "CATEGORY_SIZE_CHART_REQUIRED" };
    }

    const last = await prisma.category.findFirst({
      where: { parentId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const slug = await resolveUniqueSlug(values.slug || toSlug(values.name));

    const created = await prisma.$transaction(async (tx) => {
      // Bảng size riêng nhập ngay trong dialog → đã có số liệu nên áp dụng luôn
      const columnKeys = new Set(sizeChart?.columns.map((column) => column.key));
      const chart =
        withChart && sizeChart
          ? await tx.sizeChart.create({
              data: {
                name: values.name,
                nameEn: values.nameEn || null,
                group,
                isActive: true,
                columns: { create: sizeChart.columns.map((column, position) => ({ ...column, position })) },
                rows: {
                  create: sizeChart.rows.map((row, position) => ({
                    sizeLabel: row.sizeLabel,
                    position,
                    // Chỉ giữ số đo của các cột còn trong bảng
                    values: Object.fromEntries(
                      Object.entries(row.values).filter(([key]) => columnKeys.has(key as (typeof sizeChart.columns)[number]["key"]))
                    ) as Prisma.InputJsonObject,
                  })),
                },
              },
              select: { id: true },
            })
          : null;
      const category = await tx.category.create({
        data: {
          ...toCategoryData(customChart ? { ...values, defaultSizeChartId: chart?.id ?? "" } : values, group, parentId),
          slug,
          position: (last?.position ?? -1) + 1,
        },
        select: { id: true },
      });
      return { id: category.id, sizeChartId: chart?.id ?? null };
    });

    await recordAudit({
      actorId: auth.user.id,
      action: "CATEGORY_CREATED",
      targetType: "CATEGORY",
      targetId: created.id,
      metadata: { name: values.name, group, parentId, sizeChartId: created.sizeChartId },
    });
    revalidateCategories();
    if (created.sizeChartId) revalidatePath("/admin/catalog/size-charts");

    return {
      success: true as const,
      data: { id: created.id, sizeChartId: created.sizeChartId, tree: await getCategoryTreeQuery() },
    };
  } catch (error) {
    console.error("Lỗi createCategoryAction:", error);
    return { success: false as const, error: "CATEGORY_CREATE_FAILED" };
  }
}

/**
 * Server Action: sửa nhóm gốc hoặc loại sản phẩm.
 * Nhóm gốc: chỉ sửa tên, mô tả, hiển thị, bảng size mặc định — không đổi nhóm hàng, không thành loại con.
 * Loại sản phẩm: chuyển được sang nhóm gốc khác (nhóm hàng đổi theo gốc mới), không thành nhóm gốc.
 */
export async function updateCategoryAction(raw: z.input<typeof updateCategorySchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(updateCategorySchema, raw);
  if (!input.success) return input;
  const { categoryId, ...values } = input.data;

  try {
    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { group: true, slug: true, parentId: true },
    });
    if (!existing) return { success: false as const, error: "CATEGORY_NOT_FOUND" };

    const isRoot = existing.parentId === null;
    if (isRoot && values.parentId !== null) return { success: false as const, error: "CATEGORY_ROOT_LOCKED" };
    if (!isRoot && values.parentId === null) return { success: false as const, error: "CATEGORY_PARENT_REQUIRED" };

    const parentId = values.parentId;
    const structure = parentId
      ? await resolveStructure(values, parentId)
      : await checkSizeChart(values.defaultSizeChartId, existing.group);
    if ("error" in structure) return { success: false as const, error: structure.error };
    const { group } = structure;

    const slug = values.slug && values.slug !== existing.slug ? await resolveUniqueSlug(values.slug, categoryId) : existing.slug;
    // Chuyển sang nhóm gốc khác thì xếp cuối danh sách của gốc mới
    const movedPosition =
      parentId !== existing.parentId
        ? ((await prisma.category.findFirst({ where: { parentId }, orderBy: { position: "desc" } }))?.position ?? -1) + 1
        : undefined;

    await prisma.category.update({
      where: { id: categoryId },
      data: {
        ...toCategoryData(values, group, parentId),
        slug,
        ...(movedPosition !== undefined ? { position: movedPosition } : {}),
      },
    });

    await recordAudit({
      actorId: auth.user.id,
      action: "CATEGORY_UPDATED",
      targetType: "CATEGORY",
      targetId: categoryId,
      metadata: { group: { before: existing.group, after: group }, parentId: { before: existing.parentId, after: parentId } },
    });
    revalidateCategories();

    return { success: true as const, data: { tree: await getCategoryTreeQuery() } };
  } catch (error) {
    console.error("Lỗi updateCategoryAction:", error);
    return { success: false as const, error: "CATEGORY_UPDATE_FAILED" };
  }
}

/**
 * Server Action: lưu thứ tự hiển thị sau khi kéo thả — chỉ nhận đúng các nút cùng cha
 */
export async function reorderCategoriesAction(raw: z.input<typeof reorderCategoriesSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(reorderCategoriesSchema, raw);
  if (!input.success) return input;
  const { parentId, orderedIds } = input.data;

  try {
    const siblings = await prisma.category.findMany({ where: { parentId }, select: { id: true } });
    const siblingIds = new Set(siblings.map((s) => s.id));
    if (siblings.length !== orderedIds.length || orderedIds.some((id) => !siblingIds.has(id))) {
      return { success: false as const, error: "VALIDATION_ERROR" };
    }

    await prisma.$transaction(
      orderedIds.map((id, position) => prisma.category.update({ where: { id }, data: { position } }))
    );
    revalidateCategories();

    return { success: true as const, data: { parentId } };
  } catch (error) {
    console.error("Lỗi reorderCategoriesAction:", error);
    return { success: false as const, error: "CATEGORY_UPDATE_FAILED" };
  }
}

/**
 * Server Action: xóa loại sản phẩm trống. Nhóm gốc không xóa được; còn sản phẩm (khóa ngoại bắt buộc) thì chặn — dùng "Ẩn".
 */
export async function deleteCategoryAction(categoryId: string) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(categoryIdSchema, { categoryId });
  if (!input.success) return input;

  try {
    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { name: true, slug: true, parentId: true, _count: { select: { products: true, children: true } } },
    });
    if (!existing) return { success: false as const, error: "CATEGORY_NOT_FOUND" };
    // Nhóm gốc cố định theo nhóm hàng — không xóa, chỉ ẩn
    if (existing.parentId === null) return { success: false as const, error: "CATEGORY_ROOT_LOCKED" };
    if (existing._count.children > 0) return { success: false as const, error: "CATEGORY_HAS_CHILDREN" };
    if (existing._count.products > 0) return { success: false as const, error: "CATEGORY_IN_USE" };

    await prisma.category.delete({ where: { id: categoryId } });
    await recordAudit({
      actorId: auth.user.id,
      action: "CATEGORY_DELETED",
      targetType: "CATEGORY",
      targetId: categoryId,
      metadata: { name: existing.name, slug: existing.slug },
    });
    revalidateCategories();

    return { success: true as const, data: { tree: await getCategoryTreeQuery() } };
  } catch (error) {
    console.error("Lỗi deleteCategoryAction:", error);
    return { success: false as const, error: "CATEGORY_DELETE_FAILED" };
  }
}
