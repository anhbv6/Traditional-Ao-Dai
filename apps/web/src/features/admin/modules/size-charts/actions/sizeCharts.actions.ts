"use server";

import { type z } from "zod";
import { revalidatePath } from "next/cache";
import { PRODUCT_GROUP_TRAITS } from "@repo/shared/sizing";
import { type Prisma } from "@repo/db";
import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { recordAudit } from "../../../core/server/audit.server";
import { ADMIN_MODULE_ACCESS } from "../../../core/session/permissions";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { getAdminSizeChartDetailQuery, getAdminSizeChartsQuery, sizeChartUsageWhere } from "../queries/sizeCharts.queries";
import { toPreviewData } from "../utils/sizeChartData";
import {
  createSizeChartSchema,
  saveSizeChartSchema,
  sizeChartIdSchema,
  toggleSizeChartSchema,
} from "../schemas/sizeCharts.schemas";
import { DEFAULT_VALID_RANGE } from "../utils/sizeChartPresets";

const ACCESS = ADMIN_MODULE_ACCESS.sizeCharts;

function revalidateSizeCharts(sizeChartId?: string) {
  revalidatePath("/admin/catalog/size-charts");
  if (sizeChartId) revalidatePath(`/admin/catalog/size-charts/${sizeChartId}`);
  revalidatePath("/admin/catalog/categories");
}

/**
 * Server Action: tạo bảng size trống với các cột gợi ý theo nhóm hàng, rồi chuyển sang trình soạn
 */
export async function createSizeChartAction(raw: z.input<typeof createSizeChartSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(createSizeChartSchema, raw);
  if (!input.success) return input;
  const { name, group } = input.data;

  try {
    const created = await prisma.sizeChart.create({
      data: {
        name,
        group,
        // Bảng mới chưa có số liệu → chưa áp dụng để khách không thấy bảng rỗng
        isActive: false,
        columns: {
          create: PRODUCT_GROUP_TRAITS[group].suggestedKeys.map((key, position) => ({
            key,
            position,
            validMin: DEFAULT_VALID_RANGE[key][0],
            validMax: DEFAULT_VALID_RANGE[key][1],
          })),
        },
      },
      select: { id: true },
    });

    await recordAudit({
      actorId: auth.user.id,
      action: "SIZE_CHART_CREATED",
      targetType: "SIZE_CHART",
      targetId: created.id,
      metadata: { name, group },
    });
    revalidateSizeCharts();

    return { success: true as const, data: { id: created.id } };
  } catch (error) {
    console.error("Lỗi createSizeChartAction:", error);
    return { success: false as const, error: "SIZE_CHART_CREATE_FAILED" };
  }
}

/**
 * Server Action: lưu toàn bộ bảng size (thông tin, cột, hàng, phụ phí). Cột/hàng ghi lại từ đầu trong một transaction
 * vì trình soạn luôn gửi đủ bảng.
 */
export async function saveSizeChartAction(raw: z.input<typeof saveSizeChartSchema>) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(saveSizeChartSchema, raw);
  if (!input.success) return input;
  const { sizeChartId, columns, rows, ...values } = input.data;

  try {
    const existing = await prisma.sizeChart.findUnique({ where: { id: sizeChartId }, select: { group: true } });
    if (!existing) return { success: false as const, error: "SIZE_CHART_NOT_FOUND" };
    // Bảng đang gắn cho loại sản phẩm thì không đổi nhóm hàng — tránh áp bảng áo dài cho quần/guốc
    if (values.group !== existing.group && (await prisma.category.count({ where: { defaultSizeChartId: sizeChartId } })) > 0) {
      return { success: false as const, error: "SIZE_CHART_GROUP_LOCKED" };
    }
    if (values.isActive && rows.length === 0) return { success: false as const, error: "SIZE_CHART_EMPTY" };

    const columnKeys = new Set(columns.map((column) => column.key));
    await prisma.$transaction([
      prisma.sizeChart.update({
        where: { id: sizeChartId },
        data: {
          name: values.name,
          nameEn: values.nameEn || null,
          group: values.group,
          description: values.description || null,
          descriptionEn: values.descriptionEn || null,
          measurementGuide: values.measurementGuide || null,
          measurementGuideEn: values.measurementGuideEn || null,
          guideImage: values.guideImage || null,
          isActive: values.isActive,
          bigsizeSurchargeType: values.surchargeType,
          bigsizeSurchargeValue: values.surchargeType ? values.surchargeValue : null,
          bigsizeExtraFabric: values.extraFabric,
        },
      }),
      prisma.sizeChartColumn.deleteMany({ where: { sizeChartId } }),
      prisma.sizeChartRow.deleteMany({ where: { sizeChartId } }),
      prisma.sizeChartColumn.createMany({
        data: columns.map((column, position) => ({ ...column, sizeChartId, position })),
      }),
      prisma.sizeChartRow.createMany({
        data: rows.map((row, position) => ({
          sizeChartId,
          position,
          sizeLabel: row.sizeLabel,
          // Chỉ giữ số đo của các cột còn trong bảng
          values: Object.fromEntries(
            Object.entries(row.values).filter(([key]) => columnKeys.has(key as (typeof columns)[number]["key"]))
          ) as Prisma.InputJsonObject,
        })),
      }),
    ]);

    await recordAudit({
      actorId: auth.user.id,
      action: "SIZE_CHART_UPDATED",
      targetType: "SIZE_CHART",
      targetId: sizeChartId,
      metadata: { name: values.name, columns: columns.length, rows: rows.length, isActive: values.isActive },
    });
    revalidateSizeCharts(sizeChartId);

    return { success: true as const, data: { id: sizeChartId } };
  } catch (error) {
    console.error("Lỗi saveSizeChartAction:", error);
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
 * Server Action (chỉ đọc): dữ liệu bảng size để xem trước widget tư vấn size từ màn danh sách
 */
export async function getSizeChartPreviewAction(sizeChartId: string) {
  const auth = await authorizeAdminAction(ACCESS);
  if (!auth.success) return auth;

  const input = parseActionInput(sizeChartIdSchema, { sizeChartId });
  if (!input.success) return input;

  const detail = await getAdminSizeChartDetailQuery(sizeChartId);
  if (!detail) return { success: false as const, error: "SIZE_CHART_NOT_FOUND" };
  return { success: true as const, data: toPreviewData(detail) };
}
