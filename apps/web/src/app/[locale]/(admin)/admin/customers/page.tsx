import React from "react";
import { getAdminCustomersQuery, CustomersList } from "@/features/admin/customers";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const customers = await getAdminCustomersQuery();

  return (
    <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E4E4E7] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <Users size={14} /> Dữ liệu khách hàng CRM
          </div>
          <h2 className="text-2xl font-bold text-[#09090B] tracking-tight mt-1">
            Khách Hàng & Số Đo May Riêng
          </h2>
        </div>
        <div className="text-xs text-zinc-500">
          Tổng số <span className="font-mono font-bold text-zinc-900">{customers.length}</span> khách hàng đã đăng ký
        </div>
      </div>

      <CustomersList initialCustomers={customers} />
    </div>
  );
}
