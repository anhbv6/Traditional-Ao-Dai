import React from "react";
import { ADMIN_CARD_CLASS } from "../../ui";
import { type PieDataItem } from "../types/dashboard.types";

interface DashboardDonutChartProps {
  pieData: PieDataItem[];
  title?: string;
  subtitle?: string;
  tOverview?: string;
  tEmpty?: string;
}

const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Biểu đồ tròn phân bổ sản phẩm bán ra — các lát được tính từ `pieData` (phần trăm), không vẽ cố định
 */
export function DashboardDonutChart({
  pieData,
  title = "Phân tích Bộ sưu tập Áo Dài bán chạy",
  subtitle = "Tỷ lệ đóng góp doanh thu theo từng dòng chất liệu.",
  tOverview = "Tổng quan",
  tEmpty = "Chưa có đơn hàng trong kỳ để phân tích.",
}: DashboardDonutChartProps) {
  const total = pieData.reduce((sum, item) => sum + item.value, 0);
  // Mỗi lát bắt đầu ngay sau tổng độ dài các lát trước đó
  const slices = pieData.reduce<(PieDataItem & { dashArray: string; dashOffset: number; end: number })[]>((acc, item) => {
    const start = acc.length > 0 ? acc[acc.length - 1].end : 0;
    const length = total > 0 ? (item.value / total) * CIRCUMFERENCE : 0;
    return [...acc, { ...item, dashArray: `${length} ${CIRCUMFERENCE}`, dashOffset: -start, end: start + length }];
  }, []);

  return (
    <div className={`${ADMIN_CARD_CLASS} flex flex-col justify-between p-6 lg:col-span-2`}>
      <div>
        <h3 className="text-lg font-semibold text-[#09090B]">{title}</h3>
        <p className="mt-0.5 text-xs text-[#71717A]">{subtitle}</p>
      </div>

      <div className="mt-6 grid items-center gap-8 md:grid-cols-2">
        <div className="relative flex items-center justify-center">
          <svg className="size-44 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r={RADIUS} fill="transparent" stroke="#F4F4F5" strokeWidth="12" />
            {slices.map((slice) => (
              <circle
                key={slice.name}
                cx="50"
                cy="50"
                r={RADIUS}
                fill="transparent"
                stroke={slice.color}
                strokeWidth="12"
                strokeDasharray={slice.dashArray}
                strokeDashoffset={slice.dashOffset}
              />
            ))}
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#71717A]">{tOverview}</span>
            <span className="mt-0.5 font-mono text-xl font-bold text-[#09090B]">{total > 0 ? "100%" : "—"}</span>
          </div>
        </div>

        {slices.length > 0 ? (
          <div className="space-y-3.5">
            {slices.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs font-medium">
                <div className="flex items-center gap-2">
                  <span className="size-3.5 shrink-0 rounded-sm" style={{ backgroundColor: item.color }} />
                  <span className="text-[#09090B]">{item.name}</span>
                </div>
                <span className="font-mono font-bold text-[#09090B]">{item.value}%</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#71717A]">{tEmpty}</p>
        )}
      </div>
    </div>
  );
}
