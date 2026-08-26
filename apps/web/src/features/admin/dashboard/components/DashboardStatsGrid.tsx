import React from "react";
import { TrendingUp, ShoppingBag, Clock, Scissors } from "lucide-react";
import { type StatItem } from "../types/dashboard.types";

interface DashboardStatsGridProps {
  stats: StatItem;
  tRevenue: string;
  tOrders: string;
  tPending: string;
  tRatio: string;
  tRatioCustom: string;
  tRatioReady: string;
}

export function DashboardStatsGrid({
  stats,
  tRevenue,
  tOrders,
  tPending,
  tRatio,
  tRatioCustom,
  tRatioReady,
}: DashboardStatsGridProps) {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10 w-full max-w-full">
      {/* Doanh thu */}
      <div className="rounded-xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-[0.5px] text-[#71717A]">{tRevenue}</span>
          <div className="grid size-9 place-items-center rounded-lg bg-[#F4F4F5] text-[#09090B]">
            <TrendingUp size={18} />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-bold tracking-tight text-[#09090B] font-mono">{stats.revenue}</h3>
          <p className="mt-1 text-xs font-normal text-emerald-700 flex items-center gap-1">
            <span>{stats.revenueDiff}</span>
            <span className="text-[#71717A]">so với trước</span>
          </p>
        </div>
      </div>

      {/* Tổng đơn hàng */}
      <div className="rounded-xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-[0.5px] text-[#71717A]">{tOrders}</span>
          <div className="grid size-9 place-items-center rounded-lg bg-[#F4F4F5] text-[#09090B]">
            <ShoppingBag size={18} />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-bold tracking-tight text-[#09090B] font-mono">{stats.orders}</h3>
          <p className="mt-1 text-xs font-normal text-emerald-700 flex items-center gap-1">
            <span>{stats.ordersDiff}</span>
            <span className="text-[#71717A]">so với trước</span>
          </p>
        </div>
      </div>

      {/* Chờ xử lý */}
      <div className="rounded-xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold uppercase tracking-[0.5px] text-[#71717A]">{tPending}</span>
          <div className="grid size-9 place-items-center rounded-lg bg-[#F4F4F5] text-[#09090B]">
            <Clock size={18} />
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-3xl font-bold tracking-tight text-[#09090B] font-mono">{stats.pending}</h3>
          <p className="mt-1 text-xs text-[#71717A]">Cần hoàn thiện may đo gấp</p>
        </div>
      </div>

      {/* Tỷ lệ may sẵn/may đo */}
      <div className="rounded-xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold uppercase tracking-[0.5px] text-[#71717A]">{tRatio}</span>
          <div className="grid size-9 place-items-center rounded-lg bg-[#F4F4F5] text-[#09090B]">
            <Scissors size={18} />
          </div>
        </div>
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-[#09090B] mb-1.5">
            <span>{tRatioCustom} ({stats.customRatio}%)</span>
            <span>{tRatioReady} ({100 - stats.customRatio}%)</span>
          </div>
          {/* Custom Dual Progress Bar */}
          <div className="w-full h-2.5 rounded-full bg-[#F4F4F5] overflow-hidden border border-[#E4E4E7] flex">
            <div style={{ width: `${stats.customRatio}%` }} className="bg-[#09090B] h-full" />
            <div style={{ width: `${100 - stats.customRatio}%` }} className="bg-[#71717A] h-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
