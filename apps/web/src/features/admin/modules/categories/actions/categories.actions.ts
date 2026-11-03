"use server";

import { type z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { recordAudit } from "../../../core/server/audit.server";
import { ADMIN_MODULE_ACCESS } from "../../../core/session/permissions";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { toSlug } from "@/features/admin/modules/products";
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

/**
 * Kiểm tra chung cho tạo/sửa: cây chỉ 2 cấp (nhóm gốc → loại con) và bảng size phải cùng nhóm hàng
 * — bảng size áo dài không gắn được cho quần hay guốc.
 */
async function validateStructure(values: CategoryFormValues, categoryId?: string) {
  if (values.parentId) {
    if (values.parentId === categoryId) return "CATEGORY_PARENT_INVALID";
    const parent = await prisma.category.findUnique({ where: { id: values.parentId }, select: { parentId: true } });
    if (!parent || parent.parentId !== null) return "CATEGORY_PARENT_INVALID";
    if (categoryId && (await prisma.category.count({ where: { parentId: categoryId } })) > 0) {
      return "CATEGORY_HAS_CHILDREN";
    }
  }
  if (values.defaultSizeChartId) {
    const chart = await prisma.sizeChart.findUnique({ where: { id: values.defaultSizeChartId }, select: { group: true } });
    if (!chart) return "SIZE_CHART_NOT_FOUND";
    if (chart.group !== values.group) return "CATEGORY_SIZE_CHART_GROUP_MISMATCH";
  }
  return null;
}

function toCategoryData(values: CategoryFormValues) {
  return {
    name: values.name,
    nameEn: values.nameEn || null,
    description: values.description || null,
    descriptionEn: values.descriptionEn || null,
    group: values.group,
    isActive: values.isActive,
    defaultSizeChartId: values.defaultSizeChartId || null,
    parentId: values.parentId,
  };
}

/**
 * Server Action: thêm loại sản phẩm (nhóm gốc hoặc loại con), xếp cuối danh sách cùng cấp
 */
export async function createCategoryAction(raw: z.input<typeof createCategorySchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(createCategorySchema, raw);
  if (!input.success) return input;
  const values = input.data;

  try {
    const invalid = await validateStructure(values);
    if (invalid) return { success: false as const, error: invalid };

    const last = await prisma.category.findFirst({
      where: { parentId: values.parentId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const slug = await resolveUniqueSlug(values.slug || toSlug(values.name));
    const created = await prisma.category.create({
      data: { ...toCategoryData(values), slug, position: (last?.position ?? -1) + 1 },
      select: { id: true },
    });

    await recordAudit({
      actorId: auth.user.id,
      action: "CATEGORY_CREATED",
      targetType: "CATEGORY",
      targetId: created.id,
      metadata: { name: values.name, group: values.group, parentId: values.parentId },
    });
    revalidateCategories();

    return { success: true as const, data: { id: created.id, tree: await getCategoryTreeQuery() } };
  } catch (error) {
    console.error("Lỗi createCategoryAction:", error);
    return { success: false as const, error: "CATEGORY_CREATE_FAILED" };
  }
}

/**
 * Server Action: sửa loại sản phẩm. Đổi nhóm hàng của nhóm gốc thì loại con đang cùng nhóm cũ đổi theo.
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

    const invalid = await validateStructure(values, categoryId);
    if (invalid) return { success: false as const, error: invalid };

    const slug = values.slug && values.slug !== existing.slug ? await resolveUniqueSlug(values.slug, categoryId) : existing.slug;
    // Chuyển sang cha khác thì xếp cuối danh sách của cha mới
    const movedPosition =
      values.parentId !== existing.parentId
        ? ((await prisma.category.findFirst({ where: { parentId: values.parentId }, orderBy: { position: "desc" } }))?.position ?? -1) + 1
        : undefined;

    await prisma.$transaction(async (tx) => {
      await tx.category.update({
        where: { id: categoryId },
        data: { ...toCategoryData(values), slug, ...(movedPosition !== undefined ? { position: movedPosition } : {}) },
      });
      if (existing.parentId === null && values.group !== existing.group) {
        // Bảng size gắn ở loại con thuộc nhóm cũ không còn hợp → gỡ để không áp nhầm form
        await tx.category.updateMany({
          where: { parentId: categoryId, group: existing.group },
          data: { group: values.group, defaultSizeChartId: null },
        });
      }
    });

    await recordAudit({
      actorId: auth.user.id,
      action: "CATEGORY_UPDATED",
      targetType: "CATEGORY",
      targetId: categoryId,
      metadata: { group: { before: existing.group, after: values.group }, parentId: { before: existing.parentId, after: values.parentId } },
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
 * Server Action: xóa loại sản phẩm trống. Còn sản phẩm (khóa ngoại bắt buộc) hoặc loại con thì chặn — dùng "Ẩn" thay vì xóa.
 */
export async function deleteCategoryAction(categoryId: string) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(categoryIdSchema, { categoryId });
  if (!input.success) return input;

  try {
    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { name: true, slug: true, _count: { select: { products: true, children: true } } },
    });
    if (!existing) return { success: false as const, error: "CATEGORY_NOT_FOUND" };
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
