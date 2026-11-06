import { toVnd } from "@repo/shared";
import { isMeasurementKey, type MeasurementKey } from "@repo/shared/sizing";
import { type Prisma } from "@repo/db";
import { prisma } from "../../../core/server/db.server";
import { type AdminSizeChartDetail, type AdminSizeChartListItem } from "../types/sizeCharts.types";
import { parseRowValues } from "../utils/sizeChartData";

/**
 * Sản phẩm đang dùng bảng size: gắn trực tiếp, hoặc chưa gắn riêng và theo bảng của loại sản phẩm
 * (nhóm gốc không có bảng size). Cùng quy tắc với storefront khi chọn bảng size hiển thị.
 */
export function sizeChartUsageWhere(sizeChartId: string): Prisma.ProductWhereInput {
  return {
    OR: [{ sizeChartId }, { sizeChartId: null, category: { defaultSizeChartId: sizeChartId } }],
  };
}

/** Query: danh sách bảng size kèm số sản phẩm đang dùng */
export async function getAdminSizeChartsQuery(): Promise<AdminSizeChartListItem[]> {
  try {
    const charts = await prisma.sizeChart.findMany({
      orderBy: [{ group: "asc" }, { name: "asc" }],
      include: {
        columns: { orderBy: { position: "asc" }, select: { key: true, bigsizeFrom: true } },
        rows: { orderBy: { position: "asc" }, select: { sizeLabel: true } },
        _count: { select: { categories: true } },
      },
    });
    const productCounts = await Promise.all(
      charts.map((chart) => prisma.product.count({ where: sizeChartUsageWhere(chart.id) }))
    );

    return charts.map((chart, index) => ({
      id: chart.id,
      name: chart.name,
      nameEn: chart.nameEn,
      group: chart.group,
      isActive: chart.isActive,
      sizeLabels: chart.rows.map((row) => row.sizeLabel),
      columnKeys: chart.columns.map((column) => column.key).filter(isMeasurementKey),
      productCount: productCounts[index] ?? 0,
      categoryCount: chart._count.categories,
      hasBigsize: chart.columns.some((column) => column.bigsizeFrom !== null),
      updatedAt: chart.updatedAt.toISOString(),
    }));
  } catch (error) {
    console.error("Lỗi khi query danh sách bảng size:", error);
    return [];
  }
}

/** Query: chi tiết một bảng size cho trình soạn */
export async function getAdminSizeChartDetailQuery(sizeChartId: string): Promise<AdminSizeChartDetail | null> {
  try {
    const chart = await prisma.sizeChart.findUnique({
      where: { id: sizeChartId },
      include: {
        columns: { orderBy: { position: "asc" } },
        rows: { orderBy: { position: "asc" } },
        categories: { select: { name: true }, orderBy: { position: "asc" } },
      },
    });
    if (!chart) return null;
    const productCount = await prisma.product.count({ where: sizeChartUsageWhere(chart.id) });
    const surchargeValue = chart.bigsizeSurchargeValue
      ? chart.bigsizeSurchargeType === "FIXED_AMOUNT"
        ? toVnd(chart.bigsizeSurchargeValue)
        : Number(chart.bigsizeSurchargeValue)
      : null;

    return {
      id: chart.id,
      name: chart.name,
      nameEn: chart.nameEn ?? "",
      group: chart.group,
      description: chart.description ?? "",
      descriptionEn: chart.descriptionEn ?? "",
      measurementGuide: chart.measurementGuide ?? "",
      measurementGuideEn: chart.measurementGuideEn ?? "",
      guideImage: chart.guideImage ?? "",
      isActive: chart.isActive,
      surchargeType: chart.bigsizeSurchargeType,
      surchargeValue,
      extraFabric: chart.bigsizeExtraFabric ? Number(chart.bigsizeExtraFabric) : null,
      columns: chart.columns.flatMap((column) =>
        isMeasurementKey(column.key)
          ? [
              {
                key: column.key as MeasurementKey,
                validMin: column.validMin,
                validMax: column.validMax,
                bigsizeFrom: column.bigsizeFrom,
              },
            ]
          : []
      ),
      rows: chart.rows.map((row) => ({ uid: row.id, sizeLabel: row.sizeLabel, values: parseRowValues(row.values) })),
      productCount,
      categoryNames: chart.categories.map((category) => category.name),
      updatedAt: chart.updatedAt.toISOString(),
    };
  } catch (error) {
    console.error("Lỗi khi query chi tiết bảng size:", error);
    return null;
  }
}
