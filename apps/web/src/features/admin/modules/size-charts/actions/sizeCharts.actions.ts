"use server";

import { type z } from "zod";
import { revalidatePath } from "next/cache";
import { type Prisma } from "@repo/db";
import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { recordAudit } from "../../../core/server/audit.server";
import { ADMIN_MODULE_ACCESS } from "../../../core/session/permissions";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import {
  getAdminSizeChartDetailQuery,
  getAdminSizeChartsQuery,
  sizeChartUsageWhere,
} from "../queries/sizeCharts.queries";
import {
  createSizeChartSchema,
  saveSizeChartGridSchema,
  sizeChartIdSchema,
  toggleSizeChartSchema,
  updateSizeChartInfoSchema,
} from "../schemas/sizeCharts.schemas";
import { buildStarterSizeChart } from "../utils/sizeChartStarter";

const ACCESS = ADMIN_MODULE_ACCESS.sizeCharts;

function revalidateSizeCharts(sizeChartId?: string) {
  revalidatePath("/admin/catalog/size-charts");
  if (sizeChartId) revalidatePath(`/admin/catalog/size-charts/${sizeChartId}`);
  revalidatePath("/admin/catalog/categories");
}

type SizeChartInfo = z.infer<typeof createSizeChartSchema>;

/** Cột thông tin của bảng size để ghi Prisma (chuỗi rỗng → null, không có phụ phí thì bỏ mức phụ phí) */
function toSizeChartInfoData(values: SizeChartInfo) {
  return {
    name: values.name,
    nameEn: values.nameEn || null,
    group: values.group,
    description: values.description || null,
    descriptionEn: values.descriptionEn || null,
    measurementGuide: values.measurementGuide || null,
    measurementGuideEn: values.measurementGuideEn || null,
    guideImage: values.guideImage || null,
    bigsizeSurchargeType: values.surchargeType,
    bigsizeSurchargeValue: values.surchargeType ? values.surchargeValue : null,
    bigsizeExtraFabric: values.extraFabric,
  };
}

/**
 * Server Action: tạo bảng size từ dialog (đủ thông tin) với các cột số đo gợi ý theo nhóm hàng — số liệu nhập sau ở
 * màn chi tiết. Bảng mới chưa có hàng size nên luôn ở trạng thái chưa áp dụng.
 */
export async function createSizeChartAction(raw: z.input<typeof createSizeChartSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(createSizeChartSchema, raw);
  if (!input.success) return input;
  const values = input.data;

  try {
    const created = await prisma.sizeChart.create({
      data: {
        ...toSizeChartInfoData(values),
        // Bảng mới chưa có số liệu → chưa áp dụng để khách không thấy bảng rỗng
        isActive: false,
        ...buildStarterSizeChart(values.group),
      },
      select: { id: true },
    });

    await recordAudit({
      actorId: auth.user.id,
      action: "SIZE_CHART_CREATED",
      targetType: "SIZE_CHART",
      targetId: created.id,
      metadata: { name: values.name, group: values.group },
    });
    revalidateSizeCharts();

    return { success: true as const, data: { id: created.id } };
  } catch (error) {
    console.error("Lỗi createSizeChartAction:", error);
    return { success: false as const, error: "SIZE_CHART_CREATE_FAILED" };
  }
}

/**
 * Server Action: sửa thông tin bảng size từ dialog (tên, ghi chú, nhóm hàng, hướng dẫn đo, phụ phí bigsize, áp dụng).
 * Lưới số đo lưu riêng bằng `saveSizeChartGridAction`.
 */
export async function updateSizeChartInfoAction(raw: z.input<typeof updateSizeChartInfoSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(updateSizeChartInfoSchema, raw);
  if (!input.success) return input;
  const { sizeChartId, isActive, ...values } = input.data;

  try {
    const existing = await prisma.sizeChart.findUnique({
      where: { id: sizeChartId },
      select: { group: true, _count: { select: { rows: true, categories: true } } },
    });
    if (!existing) return { success: false as const, error: "SIZE_CHART_NOT_FOUND" };
    // Bảng đang gắn cho loại sản phẩm thì không đổi nhóm hàng — tránh áp bảng áo dài cho quần/guốc
    if (values.group !== existing.group && existing._count.categories > 0) {
      return { success: false as const, error: "SIZE_CHART_GROUP_LOCKED" };
    }
    if (isActive && existing._count.rows === 0) return { success: false as const, error: "SIZE_CHART_EMPTY" };

    await prisma.sizeChart.update({ where: { id: sizeChartId }, data: { ...toSizeChartInfoData(values), isActive } });

    await recordAudit({
      actorId: auth.user.id,
      action: "SIZE_CHART_UPDATED",
      targetType: "SIZE_CHART",
      targetId: sizeChartId,
      metadata: { name: values.name, group: values.group, isActive },
    });
    revalidateSizeCharts(sizeChartId);

    return { success: true as const, data: { id: sizeChartId } };
  } catch (error) {
    console.error("Lỗi updateSizeChartInfoAction:", error);
    return { success: false as const, error: "SIZE_CHART_UPDATE_FAILED" };
  }
}

/**
 * Server Action: lưu lưới số đo (cột + hàng) từ dialog nhập bảng size. Ghi lại từ đầu trong một transaction vì dialog
 * luôn gửi đủ bảng; xóa hết hàng thì bảng tự ngừng áp dụng (khách không thấy bảng rỗng).
 */
export async function saveSizeChartGridAction(raw: z.input<typeof saveSizeChartGridSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(saveSizeChartGridSchema, raw);
  if (!input.success) return input;
  const { sizeChartId, columns, rows } = input.data;

  try {
    const existing = await prisma.sizeChart.findUnique({ where: { id: sizeChartId }, select: { id: true } });
    if (!existing) return { success: false as const, error: "SIZE_CHART_NOT_FOUND" };

    const columnKeys = new Set<string>(columns.map((column) => column.key));
    await prisma.$transaction([
      prisma.sizeChartColumn.deleteMany({ where: { sizeChartId } }),
      prisma.sizeChartRow.deleteMany({ where: { sizeChartId } }),
      prisma.sizeChartColumn.createMany({
        data: columns.map((column, position) => ({ ...column, sizeChartId, position })),
      }),
      prisma.sizeChartRow.createMany({
        data: rows.map((row, position) => ({
          sizeChartId,
          position,
          sizeLabel: row.sizeLabel.trim(),
          // Chỉ giữ số đo của các cột còn trong bảng
          values: Object.fromEntries(
            Object.entries(row.values).filter(([key]) => columnKeys.has(key))
          ) as Prisma.InputJsonObject,
        })),
      }),
      ...(rows.length === 0
        ? [prisma.sizeChart.update({ where: { id: sizeChartId }, data: { isActive: false } })]
        : [prisma.sizeChart.update({ where: { id: sizeChartId }, data: { updatedAt: new Date() } })]),
    ]);

    await recordAudit({
      actorId: auth.user.id,
      action: "SIZE_CHART_UPDATED",
      targetType: "SIZE_CHART",
      targetId: sizeChartId,
      metadata: { columns: columns.length, rows: rows.length },
    });
    revalidateSizeCharts(sizeChartId);

    return { success: true as const, data: { id: sizeChartId } };
  } catch (error) {
    console.error("Lỗi saveSizeChartGridAction:", error);
    return { success: false as const, error: "SIZE_CHART_UPDATE_FAILED" };
  }
}

/**
 * Server Action: nhân bản bảng size (VD từ "Truyền thống" sang "Truyền thống ôm") — bản sao ở trạng thái chưa áp dụng
 */
export async function duplicateSizeChartAction(sizeChartId: string) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(sizeChartIdSchema, { sizeChartId });
  if (!input.success) return input;

  try {
    const source = await prisma.sizeChart.findUnique({
      where: { id: sizeChartId },
      include: { columns: true, rows: true },
    });
    if (!source) return { success: false as const, error: "SIZE_CHART_NOT_FOUND" };

    const copy = await prisma.sizeChart.create({
      data: {
        name: `${source.name} (bản sao)`,
        nameEn: source.nameEn ? `${source.nameEn} (copy)` : null,
        group: source.group,
        description: source.description,
        descriptionEn: source.descriptionEn,
        measurementGuide: source.measurementGuide,
        measurementGuideEn: source.measurementGuideEn,
        guideImage: source.guideImage,
        isActive: false,
        bigsizeSurchargeType: source.bigsizeSurchargeType,
        bigsizeSurchargeValue: source.bigsizeSurchargeValue,
        bigsizeExtraFabric: source.bigsizeExtraFabric,
        columns: {
          create: source.columns.map(({ key, position, validMin, validMax, bigsizeFrom }) => ({
            key,
            position,
            validMin,
            validMax,
            bigsizeFrom,
          })),
        },
        rows: {
          create: source.rows.map(({ sizeLabel, position, values }) => ({
            sizeLabel,
            position,
            values: (values ?? {}) as Prisma.InputJsonValue,
          })),
        },
      },
      select: { id: true },
    });

    await recordAudit({
      actorId: auth.user.id,
      action: "SIZE_CHART_DUPLICATED",
      targetType: "SIZE_CHART",
      targetId: copy.id,
      metadata: { sourceId: sizeChartId },
    });
    revalidateSizeCharts();

    return { success: true as const, data: { id: copy.id, charts: await getAdminSizeChartsQuery() } };
  } catch (error) {
    console.error("Lỗi duplicateSizeChartAction:", error);
    return { success: false as const, error: "SIZE_CHART_CREATE_FAILED" };
  }
}

/**
 * Server Action: bật/tắt áp dụng. Tắt bảng đang có sản phẩm dùng thì storefront ẩn bảng size và gợi ý size của các sản phẩm đó.
 */
export async function toggleSizeChartAction(raw: z.input<typeof toggleSizeChartSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(toggleSizeChartSchema, raw);
  if (!input.success) return input;
  const { sizeChartId, isActive } = input.data;

  try {
    const chart = await prisma.sizeChart.findUnique({
      where: { id: sizeChartId },
      select: { _count: { select: { rows: true } } },
    });
    if (!chart) return { success: false as const, error: "SIZE_CHART_NOT_FOUND" };
    if (isActive && chart._count.rows === 0) return { success: false as const, error: "SIZE_CHART_EMPTY" };

    await prisma.sizeChart.update({ where: { id: sizeChartId }, data: { isActive } });
    await recordAudit({
      actorId: auth.user.id,
      action: isActive ? "SIZE_CHART_ACTIVATED" : "SIZE_CHART_DEACTIVATED",
      targetType: "SIZE_CHART",
      targetId: sizeChartId,
    });
    revalidateSizeCharts(sizeChartId);

    return { success: true as const, data: { sizeChartId, isActive } };
  } catch (error) {
    console.error("Lỗi toggleSizeChartAction:", error);
    return { success: false as const, error: "SIZE_CHART_UPDATE_FAILED" };
  }
}

/**
 * Server Action: xóa bảng size chưa được dùng. Đang gắn cho sản phẩm/loại sản phẩm thì chặn
 * (khóa ngoại SetNull sẽ âm thầm gỡ bảng size khỏi sản phẩm).
 */
export async function deleteSizeChartAction(sizeChartId: string) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(sizeChartIdSchema, { sizeChartId });
  if (!input.success) return input;

  try {
    const chart = await prisma.sizeChart.findUnique({
      where: { id: sizeChartId },
      select: { name: true, _count: { select: { categories: true } } },
    });
    if (!chart) return { success: false as const, error: "SIZE_CHART_NOT_FOUND" };
    const productCount = await prisma.product.count({ where: sizeChartUsageWhere(sizeChartId) });
    if (chart._count.categories > 0 || productCount > 0) return { success: false as const, error: "SIZE_CHART_IN_USE" };

    await prisma.sizeChart.delete({ where: { id: sizeChartId } });
    await recordAudit({
      actorId: auth.user.id,
      action: "SIZE_CHART_DELETED",
      targetType: "SIZE_CHART",
      targetId: sizeChartId,
      metadata: { name: chart.name },
    });
    revalidateSizeCharts();

    return { success: true as const, data: { id: sizeChartId } };
  } catch (error) {
    console.error("Lỗi deleteSizeChartAction:", error);
    return { success: false as const, error: "SIZE_CHART_DELETE_FAILED" };
  }
}

/**
 * Server Action (chỉ đọc): chi tiết bảng size để mở dialog sửa thông tin ngay từ màn danh sách
 */
export async function getSizeChartDetailAction(sizeChartId: string) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(sizeChartIdSchema, { sizeChartId });
  if (!input.success) return input;

  const detail = await getAdminSizeChartDetailQuery(input.data.sizeChartId);
  if (!detail) return { success: false as const, error: "SIZE_CHART_NOT_FOUND" };
  return { success: true as const, data: detail };
}
