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
import { PRODUCT_GROUP_NAMES, PRODUCT_GROUP_TRAITS, type ProductGroup } from "@repo/shared/sizing";
import { getAdminSizeChartDetailQuery, rowHasMeasurement } from "@/features/admin/modules/size-charts";
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

/** Lưới bảng size nhập trong dialog (đã qua Zod) */
type CategorySizeChartGrid = NonNullable<z.infer<typeof createCategorySchema>["sizeChart"]>;

/** Bảng size riêng phải nhập đủ: có cột, có hàng, hàng nào cũng có số đo */
function isGridComplete(grid: CategorySizeChartGrid | null): grid is CategorySizeChartGrid {
  return grid !== null && grid.columns.length > 0 && grid.rows.length > 0 && grid.rows.every(rowHasMeasurement);
}

/** Cột + hàng của bảng size để ghi Prisma — chỉ giữ số đo của các cột còn trong bảng */
function gridData(grid: CategorySizeChartGrid) {
  const columnKeys = new Set<string>(grid.columns.map((column) => column.key));
  return {
    columns: grid.columns.map((column, position) => ({ ...column, position })),
    rows: grid.rows.map((row, position) => ({
      sizeLabel: row.sizeLabel.trim(),
      position,
      values: Object.fromEntries(
        Object.entries(row.values).filter(([key]) => columnKeys.has(key))
      ) as Prisma.InputJsonObject,
    })),
  };
}

/** Tạo bảng size riêng của một loại sản phẩm — đã có số liệu nên áp dụng luôn */
async function createOwnSizeChart(
  tx: Prisma.TransactionClient,
  values: Pick<CategoryFields, "name" | "nameEn">,
  group: ProductGroup,
  grid: CategorySizeChartGrid
) {
  const { columns, rows } = gridData(grid);
  return tx.sizeChart.create({
    data: {
      name: values.name,
      nameEn: values.nameEn || null,
      group,
      isActive: true,
      columns: { create: columns },
      rows: { create: rows },
    },
    select: { id: true },
  });
}

/**
 * Bảng đang gắn chỉ thuộc riêng loại này (không loại nào khác gắn, không sản phẩm nào chọn riêng) → sửa thẳng được;
 * ngược lại là bảng dùng chung, phải tạo bảng mới để không đổi số đo của nơi khác.
 */
async function isExclusiveSizeChart(sizeChartId: string, categoryId: string, group: ProductGroup) {
  const chart = await prisma.sizeChart.findUnique({
    where: { id: sizeChartId },
    select: {
      group: true,
      _count: { select: { products: true } },
      categories: { select: { id: true } },
    },
  });
  return (
    chart !== null &&
    chart.group === group &&
    chart._count.products === 0 &&
    chart.categories.length === 1 &&
    chart.categories[0]?.id === categoryId
  );
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
    if (withChart && !isGridComplete(sizeChart)) {
      return { success: false as const, error: "CATEGORY_SIZE_CHART_REQUIRED" };
    }

    const last = await prisma.category.findFirst({
      where: { parentId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const slug = await resolveUniqueSlug(values.slug || toSlug(values.name));

    const created = await prisma.$transaction(async (tx) => {
      const chart = withChart && sizeChart ? await createOwnSizeChart(tx, values, group, sizeChart) : null;
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
 * Nhóm gốc: chỉ sửa mô tả, hiển thị — tên cố định hai ngôn ngữ (`PRODUCT_GROUP_NAMES`), không có bảng size,
 * không đổi nhóm hàng, không thành loại con.
 * Loại sản phẩm: chuyển được sang nhóm gốc khác (nhóm hàng đổi theo gốc mới), không thành nhóm gốc. Bảng size như lúc
 * thêm: `"custom"` = nhập bảng riêng (bảng đang gắn chỉ thuộc loại này thì sửa thẳng, bảng dùng chung thì tạo bảng mới;
 * không gửi lưới thì giữ bảng đang gắn), `"preset"` = gắn bảng size mẫu.
 */
export async function updateCategoryAction(raw: z.input<typeof updateCategorySchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(updateCategorySchema, raw);
  if (!input.success) return input;
  const { categoryId, sizeChartMode, sizeChart, ...rawValues } = input.data;

  try {
    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { group: true, slug: true, parentId: true, defaultSizeChartId: true },
    });
    if (!existing) return { success: false as const, error: "CATEGORY_NOT_FOUND" };

    const isRoot = existing.parentId === null;
    if (isRoot && rawValues.parentId !== null) return { success: false as const, error: "CATEGORY_ROOT_LOCKED" };
    if (!isRoot && rawValues.parentId === null) return { success: false as const, error: "CATEGORY_PARENT_REQUIRED" };

    const parentId = rawValues.parentId;
    // Nhóm gốc không có bảng size; "custom" xử lý bảng riêng ở dưới nên bỏ id client gửi
    const customChart = !isRoot && sizeChartMode === "custom";
    const values = {
      ...rawValues,
      // Tên nhóm gốc cố định — bỏ qua tên client gửi lên
      ...(isRoot ? PRODUCT_GROUP_NAMES[existing.group] : {}),
      defaultSizeChartId: isRoot || customChart ? "" : rawValues.defaultSizeChartId,
    };
    const structure = parentId ? await resolveStructure(values, parentId) : { group: existing.group };
    if ("error" in structure) return { success: false as const, error: structure.error };
    const { group } = structure;

    // Bảng size riêng: lưới mới (sửa thẳng bảng riêng hoặc tạo bảng mới), hoặc giữ bảng đang gắn nếu cùng nhóm hàng
    let ownChart: { grid: CategorySizeChartGrid; replaceId: string | null } | null = null;
    if (customChart && PRODUCT_GROUP_TRAITS[group].sizing !== "NONE") {
      if (sizeChart) {
        if (!isGridComplete(sizeChart)) return { success: false as const, error: "CATEGORY_SIZE_CHART_REQUIRED" };
        const currentId = existing.defaultSizeChartId;
        const replaceId = currentId && (await isExclusiveSizeChart(currentId, categoryId, group)) ? currentId : null;
        ownChart = { grid: sizeChart, replaceId };
      } else {
        const kept = existing.defaultSizeChartId ? await checkSizeChart(existing.defaultSizeChartId, group) : null;
        if (!existing.defaultSizeChartId || !kept || "error" in kept) {
          return { success: false as const, error: "CATEGORY_SIZE_CHART_REQUIRED" };
        }
        values.defaultSizeChartId = existing.defaultSizeChartId;
      }
    }

    const slug =
      values.slug && values.slug !== existing.slug ? await resolveUniqueSlug(values.slug, categoryId) : existing.slug;
    // Chuyển sang nhóm gốc khác thì xếp cuối danh sách của gốc mới
    const movedPosition =
      parentId !== existing.parentId
        ? ((await prisma.category.findFirst({ where: { parentId }, orderBy: { position: "desc" } }))?.position ?? -1) +
          1
        : undefined;

    const sizeChartId = await prisma.$transaction(async (tx) => {
      let chartId = values.defaultSizeChartId;
      if (ownChart?.replaceId) {
        // Bảng riêng của loại này: thay toàn bộ cột / hàng bằng lưới vừa nhập
        const { columns, rows } = gridData(ownChart.grid);
        await tx.sizeChartColumn.deleteMany({ where: { sizeChartId: ownChart.replaceId } });
        await tx.sizeChartRow.deleteMany({ where: { sizeChartId: ownChart.replaceId } });
        await tx.sizeChart.update({
          where: { id: ownChart.replaceId },
          data: { columns: { create: columns }, rows: { create: rows } },
        });
        chartId = ownChart.replaceId;
      } else if (ownChart) {
        chartId = (await createOwnSizeChart(tx, values, group, ownChart.grid)).id;
      }
      await tx.category.update({
        where: { id: categoryId },
        data: {
          ...toCategoryData({ ...values, defaultSizeChartId: chartId }, group, parentId),
          slug,
          ...(movedPosition !== undefined ? { position: movedPosition } : {}),
        },
      });
      return chartId || null;
    });

    await recordAudit({
      actorId: auth.user.id,
      action: "CATEGORY_UPDATED",
      targetType: "CATEGORY",
      targetId: categoryId,
      metadata: {
        group: { before: existing.group, after: group },
        parentId: { before: existing.parentId, after: parentId },
        sizeChartId: { before: existing.defaultSizeChartId, after: sizeChartId },
      },
    });
    revalidateCategories();
    if (ownChart) revalidatePath("/admin/catalog/size-charts");

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

/**
 * Server Action (chỉ đọc): bảng size đang gắn của một loại sản phẩm — để dialog sửa nạp lưới vào "Nhập bảng size riêng".
 * `exclusive` = bảng chỉ thuộc riêng loại này (lưu sẽ sửa thẳng bảng); ngược lại là bảng mẫu dùng chung.
 */
export async function getCategorySizeChartAction(categoryId: string) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(categoryIdSchema, { categoryId });
  if (!input.success) return input;

  try {
    const category = await prisma.category.findUnique({
      where: { id: input.data.categoryId },
      select: { group: true, parentId: true, defaultSizeChartId: true },
    });
    if (!category) return { success: false as const, error: "CATEGORY_NOT_FOUND" };
    // Nhóm gốc không có bảng size
    const chartId = category.parentId ? category.defaultSizeChartId : null;
    const chart = chartId ? await getAdminSizeChartDetailQuery(chartId) : null;
    if (!chart) return { success: true as const, data: null };

    return {
      success: true as const,
      data: {
        id: chart.id,
        name: chart.name,
        grid: { columns: chart.columns, rows: chart.rows },
        exclusive: await isExclusiveSizeChart(chart.id, input.data.categoryId, category.group),
      },
    };
  } catch (error) {
    console.error("Lỗi getCategorySizeChartAction:", error);
    return { success: false as const, error: "CATEGORY_LOAD_FAILED" };
  }
}
