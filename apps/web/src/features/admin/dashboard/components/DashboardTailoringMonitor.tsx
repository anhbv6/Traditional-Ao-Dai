import React from "react";
import { Activity } from "lucide-react";
import { type OrderItem, type OrderStatus } from "../types/dashboard.types";

interface DashboardTailoringMonitorProps {
  orders: OrderItem[];
  onSelectOrder: (order: OrderItem) => void;
  stepLabels: {
    measuring: string;
    cutting: string;
    sewing: string;
    embellishing: string;
    finishing: string;
  };
}

export function DashboardTailoringMonitor({
  orders,
  onSelectOrder,
  stepLabels,
}: DashboardTailoringMonitorProps) {
  const getProgressPercent = (status: OrderStatus) => {
    switch (status) {
      case "pending_approval":
        return 15;
      case "cutting_fabric":
        return 40;
      case "sewing_job":
        return 70;
      case "shipping":
        return 90;
      default:
        return 100;
    }
  };

  const getStepName = (status: OrderStatus) => {
    switch (status) {
      case "pending_approval":
        return stepLabels.measuring;
      case "cutting_fabric":
        return stepLabels.cutting;
      case "sewing_job":
        return stepLabels.sewing;
      case "shipping":
        return stepLabels.embellishing;
      default:
        return stepLabels.finishing;
    }
  };

  return (
    <div className="rounded-xl border border-[#E4E4E7] bg-white p-6 shadow-sm mb-10 w-full max-w-full">
      <div className="border-b border-[#E4E4E7] pb-5 mb-6 flex items-center gap-2.5">
        <Activity size={20} className="text-[#09090B]" />
        <div>
          <h3 className="text-lg font-semibold text-[#09090B]">
            Theo dõi Tiến độ May đo (Bespoke Workflow)
          </h3>
          <p className="text-xs text-[#71717A]">Tiến độ cắt rập, ráp khâu thủ công của thợ may nghệ nhân.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {orders
          .filter((o) => o.type === "custom" && o.status !== "completed")
          .map((order) => {
            const progress = getProgressPercent(order.status);

            return (
              <div key={order.id} className="p-4 rounded-lg border border-[#E4E4E7] bg-[#FAFAFA]/50 flex flex-col justify-between gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#09090B] bg-[#F4F4F5] px-2 py-0.5 rounded font-mono">
                    {order.id}
                  </span>
                  <span className="text-xs font-semibold text-[#09090B]">{order.customer}</span>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-[#09090B] mb-1.5">
                    <span>{getStepName(order.status)}</span>
                    <span className="font-mono">{progress}%</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-[#F4F4F5] overflow-hidden border border-[#E4E4E7]">
                    <div style={{ width: `${progress}%` }} className="bg-[#09090B] h-full" />
                  </div>
                </div>

                <div className="flex justify-between items-center text-[11px] text-[#71717A]">
                  <span>Số đo: Ngực {order.measurements?.bust} • Eo {order.measurements?.waist}</span>
                  <button
                    onClick={() => onSelectOrder(order)}
                    className="text-[#09090B] font-bold uppercase tracking-[0.5px] hover:underline cursor-pointer"
                  >
                    Chi tiết
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
