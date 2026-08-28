import React from "react";
import { getAdminVouchersQuery, VouchersList } from "@/features/admin/vouchers";
import { Ticket } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminVouchersPage() {
  const vouchers = await getAdminVouchersQuery();

  return (
    <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-12 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E4E4E7] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
            <Ticket size={14} /> Marketing & Khuyến mãi
          </div>
          <h2 className="text-2xl font-bold text-[#09090B] tracking-tight mt-1">
            Mã Giảm Giá (Vouchers)
          </h2>
        </div>
        <div className="text-xs text-zinc-500">
          Tổng cộng <span className="font-mono font-bold text-zinc-900">{vouchers.length}</span> mã khuyến mãi
        </div>
      </div>

      <VouchersList initialVouchers={vouchers} />
    </div>
  );
}
