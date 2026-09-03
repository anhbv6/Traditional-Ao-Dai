import React from "react";
import { AlertTriangle } from "lucide-react";

interface DashboardAlertsProps {
  tLowFabrics: string;
  tLowStock: string;
  title?: string;
  subtitle?: string;
}

export function DashboardAlerts({
  tLowFabrics,
  tLowStock,
  title = "Cảnh báo Vận hành & Kho vải",
  subtitle = "Vật liệu và sản phẩm cần bổ sung khẩn cấp.",
}: DashboardAlertsProps) {
  return (
    <div className="rounded-xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold text-[#09090B] flex items-center gap-2">
          <AlertTriangle size={18} className="text-[#09090B]" />
          {title}
        </h3>
        <p className="text-xs text-[#71717A] mt-0.5">{subtitle}</p>
      </div>

      <div className="space-y-4 mt-6 overflow-y-auto max-h-[220px] scrollbar-thin">
        {/* Warning 1 */}
        <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/30 flex gap-3.5">
          <AlertTriangle size={18} className="text-amber-700 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">{tLowFabrics}</h4>
            <p className="text-xs font-semibold text-[#09090B] mt-1">Lụa tơ tằm đỏ đô (Mã LH-09)</p>
            <p className="text-[10px] text-[#71717A] mt-0.5">Còn 12m - Thấp hơn mức tối thiểu để phục vụ 8 đơn may đo.</p>
          </div>
        </div>

        {/* Warning 2 */}
        <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/30 flex gap-3.5">
          <AlertTriangle size={18} className="text-rose-700 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">{tLowStock}</h4>
            <p className="text-xs font-semibold text-[#09090B] mt-1">Áo Dài Cách Tân Hoa Đào (Size M)</p>
            <p className="text-[10px] text-[#71717A] mt-0.5">Còn 2 sản phẩm - Mẫu áo bán chạy đang thiếu size phổ biến.</p>
          </div>
        </div>

        {/* Warning 3 */}
        <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/30 flex gap-3.5">
          <AlertTriangle size={18} className="text-rose-700 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">{tLowStock}</h4>
            <p className="text-xs font-semibold text-[#09090B] mt-1">Áo Dài Gấm Song Hỷ (Size S)</p>
            <p className="text-[10px] text-[#71717A] mt-0.5">Còn 3 sản phẩm - Cần nhập thêm gấp.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
