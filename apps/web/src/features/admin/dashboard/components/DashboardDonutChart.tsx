import React from "react";
import { type PieDataItem } from "../types/dashboard.types";

interface DashboardDonutChartProps {
  pieData: PieDataItem[];
  title?: string;
  subtitle?: string;
  tOverview?: string;
}

export function DashboardDonutChart({
  pieData,
  title = "Phân tích Bộ sưu tập Áo Dài bán chạy",
  subtitle = "Tỷ lệ đóng góp doanh thu theo từng dòng chất liệu.",
  tOverview = "Tổng quan",
}: DashboardDonutChartProps) {
  return (
    <div className="rounded-xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between lg:col-span-2">
      <div>
        <h3 className="text-lg font-semibold text-[#09090B]">
          {title}
        </h3>
        <p className="text-xs text-[#71717A] mt-0.5">{subtitle}</p>
      </div>

      <div className="grid md:grid-cols-2 items-center gap-8 mt-6">
        {/* Donut Chart SVG */}
        <div className="relative flex justify-center items-center">
          <svg className="size-44" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F4F4F5" strokeWidth="12" />
            {/* Slice 1: 38% */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#09090B"
              strokeWidth="12"
              strokeDasharray="90.7 238.7"
              strokeDashoffset="0"
            />
            {/* Slice 2: 25% */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#27272A"
              strokeWidth="12"
              strokeDasharray="59.7 238.7"
              strokeDashoffset="-90.7"
            />
            {/* Slice 3: 22% */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#71717A"
              strokeWidth="12"
              strokeDasharray="52.5 238.7"
              strokeDashoffset="-150.4"
            />
            {/* Slice 4: 15% */}
            <circle
              cx="50"
              cy="50"
              r="38"
              fill="transparent"
              stroke="#E4E4E7"
              strokeWidth="12"
              strokeDasharray="35.8 238.7"
              strokeDashoffset="-202.9"
            />
          </svg>
          {/* Centered overall indicator */}
          <div className="absolute flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#71717A]">{tOverview}</span>
            <span className="text-xl font-bold text-[#09090B] font-mono mt-0.5">100%</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3.5">
          {pieData.map((item, index) => (
            <div key={index} className="flex items-center justify-between text-xs font-medium">
              <div className="flex items-center gap-2">
                <span className="size-3.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-[#09090B]">{item.name}</span>
              </div>
              <span className="text-[#09090B] font-bold font-mono">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
