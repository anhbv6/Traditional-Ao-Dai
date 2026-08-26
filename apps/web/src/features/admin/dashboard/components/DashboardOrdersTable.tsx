import React from "react";
import { ChevronRight } from "lucide-react";
import { type OrderItem, type OrderStatus } from "../types/dashboard.types";

interface DashboardOrdersTableProps {
  orders: OrderItem[];
  onSelectOrder: (order: OrderItem) => void;
  getStatusColor: (status: OrderStatus) => string;
  labels: {
    title: string;
    orderId: string;
    customer: string;
    type: string;
    total: string;
    status: string;
    typeCustom: string;
    typeReady: string;
    statusLabels: Record<OrderStatus, string>;
  };
}

export function DashboardOrdersTable({
  orders,
  onSelectOrder,
  getStatusColor,
  labels,
}: DashboardOrdersTableProps) {
  return (
    <div className="rounded-xl border border-[#E4E4E7] bg-white p-6 shadow-sm sm:p-8">
      <div className="border-b border-[#E4E4E7] pb-5 mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#09090B]">
          {labels.title}
        </h3>
        <span className="text-[10px] font-bold text-white bg-[#09090B] px-3 py-1 rounded-full uppercase tracking-[0.5px] select-none font-mono">
          Live
        </span>
      </div>

      <div className="overflow-x-auto w-full min-w-0">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="border-b border-[#E4E4E7] text-sm font-semibold uppercase tracking-[0.5px] text-[#71717A]">
              <th className="pb-4 pr-4">{labels.orderId}</th>
              <th className="pb-4 pr-4">{labels.customer}</th>
              <th className="pb-4 pr-4">{labels.type}</th>
              <th className="pb-4 pr-4">{labels.total}</th>
              <th className="pb-4 pr-4">{labels.status}</th>
              <th className="pb-4 text-right">Chi tiết</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7] text-sm text-[#09090B]">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-[#FAFAFA]/70 transition-colors">
                <td className="py-4 pr-4">
                  <button
                    onClick={() => onSelectOrder(order)}
                    className="font-bold text-[#09090B] hover:underline cursor-pointer font-mono"
                  >
                    {order.id}
                  </button>
                </td>
                <td className="py-4 pr-4 font-normal text-[#09090B]">{order.customer}</td>
                <td className="py-4 pr-4">
                  <span
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.5px] ${
                      order.type === "custom"
                        ? "bg-[#09090B] text-white border border-[#09090B]"
                        : "bg-[#F4F4F5] text-[#71717A] border border-[#E4E4E7]"
                    }`}
                  >
                    {order.type === "custom" ? labels.typeCustom : labels.typeReady}
                  </span>
                </td>
                <td className="py-4 pr-4 font-bold font-mono text-[#09090B]">{order.total}</td>
                <td className="py-4 pr-4">
                  <span
                    className={`inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {labels.statusLabels[order.status]}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <button
                    onClick={() => onSelectOrder(order)}
                    className="inline-flex size-8 items-center justify-center rounded-lg border border-[#E4E4E7] text-[#09090B] hover:bg-[#09090B] hover:text-white transition-all cursor-pointer"
                  >
                    <ChevronRight size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
