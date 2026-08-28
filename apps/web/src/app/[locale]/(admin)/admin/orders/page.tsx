import React from "react";
import { getAdminOrdersListQuery, OrdersList } from "@/features/admin/orders";
import { ShoppingBag } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrdersListQuery();

  return (
    <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E4E4E7] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <ShoppingBag size={14} /> Quản lý bán hàng
          </div>
          <h2 className="text-2xl font-bold text-[#09090B] tracking-tight mt-1">
            Đơn Hàng Áo Dài
          </h2>
        </div>
        <div className="text-xs text-zinc-500">
          Tổng số <span className="font-mono font-bold text-zinc-900">{orders.length}</span> đơn hàng
        </div>
      </div>

      <OrdersList initialOrders={orders} />
    </div>
  );
}
