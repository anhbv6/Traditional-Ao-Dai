"use client";

import { useTranslations } from "next-intl";
import { MEASUREMENT_UNITS } from "@repo/shared/sizing";
import { formatRange, type AdminSizeChartDetail } from "@/features/admin/modules/size-charts";

/**
 * Bảng size chỉ xem trong màn chi tiết loại sản phẩm: hàng = size, cột = thông số đo (khoảng từ – đến).
 * Sửa số đo ở màn Bảng size mẫu.
 */
export function CategorySizeChartTable({ chart }: { chart: Pick<AdminSizeChartDetail, "columns" | "rows"> }) {
  const t = useTranslations("AdminPage.categories.detail.chart");
  const tSizing = useTranslations("AdminPage.sizing");

  if (chart.rows.length === 0 || chart.columns.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-[#E4E4E7] px-3 py-6 text-center text-xs text-[#71717A]">
        {t("empty")}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#E4E4E7]">
      <table className="w-full border-collapse text-sm" style={{ minWidth: 80 + chart.columns.length * 96 }}>
        <thead>
          <tr className="text-left">
            <th className="sticky left-0 z-10 border-b border-dashed border-[#E4E4E7] bg-white px-3 py-2.5 text-body font-semibold text-[#09090B]">
              {t("size")}
            </th>
            {chart.columns.map((column) => (
              <th
                key={column.key}
                className="border-b border-dashed border-[#E4E4E7] px-3 py-2.5 align-bottom font-normal"
              >
                <span className="block text-body font-semibold text-[#09090B]">
                  {tSizing(`measurement.${column.key}`)}
                </span>
                <span className="text-2xs text-[#71717A]">{tSizing(`unit.${MEASUREMENT_UNITS[column.key]}`)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr:last-child>td]:border-b-0">
          {chart.rows.map((row) => (
            <tr key={row.uid} className="hover:bg-[#FAFAFA]">
              <td className="sticky left-0 z-10 border-b border-dashed border-[#E4E4E7] bg-white px-3 py-2.5 font-mono text-sm font-semibold text-[#09090B]">
                {row.sizeLabel}
              </td>
              {chart.columns.map((column) => (
                <td
                  key={column.key}
                  className="border-b border-dashed border-[#E4E4E7] px-3 py-2.5 font-mono tabular-nums text-[#3F3F46]"
                >
                  {formatRange(row.values[column.key])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
