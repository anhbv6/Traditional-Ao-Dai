"use client";

import React, { useState, useTransition } from "react";
import { type AdminVoucherItem } from "../types/vouchers.types";
import { toggleVoucherActiveAction } from "../actions/vouchers.actions";
import {
  Ticket,
  Search,
  Plus,
  Percent,
  DollarSign,
  Calendar,
  CheckCircle,
  XCircle,
} from "lucide-react";

interface VouchersListProps {
  initialVouchers: AdminVoucherItem[];
}

export function VouchersList({ initialVouchers }: VouchersListProps) {
  const [vouchers, setVouchers] = useState<AdminVoucherItem[]>(initialVouchers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isPending, startTransition] = useTransition();

  const filtered = vouchers.filter((v) => {
    return (
      v.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleToggleActive = (voucherId: string, current: boolean) => {
    startTransition(async () => {
      const res = await toggleVoucherActiveAction(voucherId, !current);
      if (res.success) {
        setVouchers((prev) =>
          prev.map((v) => (v.id === voucherId ? { ...v, isActive: !current } : v))
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Search & Action */}
      <div className="bg-white p-4 rounded-xl border border-[#E4E4E7] shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm theo mã voucher, mô tả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-[#E4E4E7] rounded-lg text-sm focus:outline-none focus:border-zinc-900 transition-colors"
          />
        </div>

        <button
          className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#18181B] hover:bg-[#09090B] text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
        >
          <Plus size={14} /> Tạo mã Voucher mới
        </button>
      </div>

      {/* Vouchers Grid / Table */}
      <div className="bg-white rounded-xl border border-[#E4E4E7] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E4E4E7] bg-zinc-50/50 text-[11px] font-semibold text-[#71717A] uppercase tracking-wider">
                <th className="py-3 px-4">Mã Voucher</th>
                <th className="py-3 px-4">Mức giảm</th>
                <th className="py-3 px-4">Đơn tối thiểu</th>
                <th className="py-3 px-4">Đã dùng / Giới hạn</th>
                <th className="py-3 px-4">Hiệu lực</th>
                <th className="py-3 px-4">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7] text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#71717A]">
                    <Ticket className="mx-auto size-8 text-zinc-300 mb-2" />
                    Chưa có mã giảm giá nào.
                  </td>
                </tr>
              ) : (
                filtered.map((voucher) => {
                  const isExpired = new Date(voucher.endDate) < new Date();

                  return (
                    <tr key={voucher.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-xs text-[#09090B] bg-zinc-100 px-2.5 py-1 rounded inline-block border border-[#E4E4E7]">
                          {voucher.code}
                        </div>
                        {voucher.description && (
                          <div className="text-xs text-[#71717A] mt-1 line-clamp-1">
                            {voucher.description}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-[#09090B]">
                        {voucher.discountType === "PERCENTAGE" ? (
                          <span className="inline-flex items-center gap-1 text-purple-700 font-mono">
                            <Percent size={13} /> {voucher.value}%
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-mono">
                            <DollarSign size={13} /> {voucher.value.toLocaleString("vi-VN")} ₫
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-zinc-700">
                        {voucher.minOrderValue
                          ? `${voucher.minOrderValue.toLocaleString("vi-VN")} ₫`
                          : "Không yêu cầu"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-xs text-zinc-800">
                        <span className="font-bold">{voucher.usedCount}</span>
                        {voucher.usageLimit ? ` / ${voucher.usageLimit}` : " / ∞"}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-zinc-600">
                        <div className="flex items-center gap-1 font-mono">
                          <Calendar size={12} className="text-zinc-400" />
                          {new Date(voucher.startDate).toLocaleDateString("vi-VN")} -{" "}
                          {new Date(voucher.endDate).toLocaleDateString("vi-VN")}
                        </div>
                        {isExpired && (
                          <span className="text-[10px] text-rose-600 font-semibold block mt-0.5">
                            Đã hết hạn
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          disabled={isPending}
                          onClick={() => handleToggleActive(voucher.id, voucher.isActive)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                            voucher.isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-zinc-100 text-[#71717A] border-[#E4E4E7]"
                          }`}
                        >
                          {voucher.isActive ? (
                            <>
                              <CheckCircle size={12} /> Đang mở
                            </>
                          ) : (
                            <>
                              <XCircle size={12} /> Đang tắt
                            </>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
