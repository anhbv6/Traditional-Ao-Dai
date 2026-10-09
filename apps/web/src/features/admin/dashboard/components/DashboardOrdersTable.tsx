import React from "react";
import { ChevronRight, Inbox } from "lucide-react";
import { type OrderItem, type OrderStatus } from "../types/dashboard.types";

interface DashboardOrdersTableProps {
  orders: OrderItem[];
  isLoading?: boolean;
  onSelectOrder: (order: OrderItem) => void;
  getStatusColor: (status: OrderStatus) => string;
  labels: {
    title: string;
    orderId: string;
    customer: string;
    type: string;
    total: string;
    status: string;
    actionDetail?: string;
    liveBadge?: string;
    typeCustom: string;
    typeReady: string;
    noOrders?: string;
    statusLabels: Record<OrderStatus, string>;
  };
}

export function DashboardOrdersTable({
  orders,
  isLoading,
  onSelectOrder,
  getStatusColor,
  labels,
}: DashboardOrdersTableProps) {
  return (
    <div className="rounded-xl border border-[#E4E4E7] bg-white p-6 shadow-2xs sm:p-8">
      <div className="border-b border-[#E4E4E7] pb-5 mb-6 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-[#09090B]">
          {labels.title}
        </h3>
        <span className="text-[10px] font-bold text-white bg-[#09090B] px-3 py-1 rounded-full uppercase tracking-[0.5px] select-none font-mono">
          {labels.liveBadge || "Live"}
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
              <th className="pb-4 text-right">{labels.actionDetail || "Chi tiết"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E4E7] text-sm text-[#09090B]">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td className="py-4 pr-4"><div className="h-4 w-20 bg-zinc-200 rounded" /></td>
                  <td className="py-4 pr-4"><div className="h-4 w-32 bg-zinc-200 rounded" /></td>
                  <td className="py-4 pr-4"><div className="h-4 w-16 bg-zinc-200 rounded" /></td>
                  <td className="py-4 pr-4"><div className="h-4 w-24 bg-zinc-200 rounded" /></td>
                  <td className="py-4 pr-4"><div className="h-5 w-24 bg-zinc-200 rounded-full" /></td>
                  <td className="py-4 text-right"><div className="size-8 ml-auto bg-zinc-100 rounded-lg" /></td>
                </tr>
              ))
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-[#71717A]">
                  <Inbox size={32} className="mx-auto mb-2 text-zinc-300" />
                  <p className="text-xs font-medium">{labels.noOrders || "Chưa có đơn hàng nào."}</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => (
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
                      title={labels.actionDetail || "Chi tiết"}
                    >
                      <ChevronRight size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
