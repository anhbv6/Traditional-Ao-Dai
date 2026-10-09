import React from "react";
import { AlertTriangle, PackageCheck } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { ADMIN_CARD_CLASS } from "../../ui";
import { type LowStockVariant } from "../queries/dashboard.queries";

interface DashboardAlertsProps {
  items: LowStockVariant[];
  isLoading?: boolean;
  title: string;
  subtitle: string;
  tLowStock: string;
  tStockLeft: string;
  tEmpty: string;
}

/**
 * Cảnh báo vận hành: các SKU của sản phẩm đang bán có tồn kho thấp (dữ liệu thật từ ProductVariant)
 */
export function DashboardAlerts({ items, isLoading, title, subtitle, tLowStock, tStockLeft, tEmpty }: DashboardAlertsProps) {
  return (
    <div className={`${ADMIN_CARD_CLASS} flex flex-col p-6`}>
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold text-[#09090B]">
          <AlertTriangle size={18} />
          {title}
        </h3>
        <p className="mt-0.5 text-xs text-[#71717A]">{subtitle}</p>
      </div>

      <div className="mt-6 max-h-[220px] space-y-3 overflow-y-auto">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Spinner className="size-5 text-[#71717A]" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center text-xs text-[#71717A]">
            <PackageCheck size={20} />
            <span>{tEmpty}</span>
          </div>
        ) : (
          items.map((item) => {
            const isOut = item.stock === 0;
            return (
              <div
                key={item.id}
                className={`flex gap-3 rounded-lg border p-3 ${isOut ? "border-rose-200 bg-rose-50/40" : "border-amber-200 bg-amber-50/40"}`}
              >
                <AlertTriangle size={16} className={`mt-0.5 shrink-0 ${isOut ? "text-rose-700" : "text-amber-700"}`} />
                <div className="min-w-0">
                  <p className={`text-[10px] font-bold uppercase tracking-wider ${isOut ? "text-rose-800" : "text-amber-800"}`}>
                    {tLowStock}
                  </p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-[#09090B]">
                    {item.productName} — {item.size}
                    {item.color ? ` / ${item.color}` : ""}
                  </p>
                  <p className="mt-0.5 font-mono text-[10px] text-[#71717A]">
                    {item.sku} · {tStockLeft}: {item.stock}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
