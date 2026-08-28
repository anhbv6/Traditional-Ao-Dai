"use client";

import React, { useState, useTransition } from "react";
import { type AdminCustomerItem } from "../types/customers.types";
import { toggleCustomerActiveAction } from "../actions/customers.actions";
import {
  Users,
  Search,
  Ruler,
  Phone,
  Mail,
  ShoppingBag,
  CheckCircle,
  XCircle,
  ChevronRight,
} from "lucide-react";

interface CustomersListProps {
  initialCustomers: AdminCustomerItem[];
}

export function CustomersList({ initialCustomers }: CustomersListProps) {
  const [customers, setCustomers] = useState<AdminCustomerItem[]>(initialCustomers);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomerItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = customers.filter((c) => {
    return (
      c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone?.includes(searchTerm)
    );
  });

  const handleToggleActive = (userId: string, current: boolean) => {
    startTransition(async () => {
      const res = await toggleCustomerActiveAction(userId, !current);
      if (res.success) {
        setCustomers((prev) =>
          prev.map((c) => (c.id === userId ? { ...c, isActive: !current } : c))
        );
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="bg-white p-4 rounded-xl border border-[#E4E4E7] shadow-2xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, email, SĐT khách..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-[#E4E4E7] rounded-lg text-sm focus:outline-none focus:border-zinc-900 transition-colors"
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-[#E4E4E7] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E4E4E7] bg-zinc-50/50 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Số điện thoại</th>
                <th className="py-3 px-4">Đơn hàng</th>
                <th className="py-3 px-4">Tổng chi tiêu</th>
                <th className="py-3 px-4">Hồ sơ số đo</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7] text-sm">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-500">
                    <Users className="mx-auto size-8 text-zinc-300 mb-2" />
                    Không tìm thấy khách hàng nào.
                  </td>
                </tr>
              ) : (
                filtered.map((cust) => (
                  <tr
                    key={cust.id}
                    onClick={() => setSelectedCustomer(cust)}
                    className="hover:bg-zinc-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-900">{cust.name || "Khách vãng lai"}</div>
                      <div className="text-xs text-zinc-400 font-mono">{cust.email || "--"}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-zinc-700 text-xs">
                      {cust.phone || "--"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-zinc-800">
                        <ShoppingBag size={12} className="text-zinc-400" /> {cust.ordersCount} đơn
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-zinc-900">
                      {cust.totalSpent.toLocaleString("vi-VN")} ₫
                    </td>
                    <td className="py-3.5 px-4">
                      {cust.measurements.length > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          <Ruler size={11} /> {cust.measurements.length} hồ sơ số đo
                        </span>
                      ) : (
                        <span className="text-xs text-zinc-400">Chưa lưu số đo</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        disabled={isPending}
                        onClick={() => handleToggleActive(cust.id, cust.isActive)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                          cust.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {cust.isActive ? (
                          <>
                            <CheckCircle size={12} /> Hoạt động
                          </>
                        ) : (
                          <>
                            <XCircle size={12} /> Đang khóa
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 transition-colors">
                        <ChevronRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer xem hồ sơ số đo của khách */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Hồ sơ khách hàng
                  </div>
                  <h3 className="text-lg font-bold text-zinc-900">
                    {selectedCustomer.name || "Khách hàng"}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="p-1.5 text-zinc-400 hover:text-zinc-900 rounded-lg hover:bg-zinc-100 cursor-pointer"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* Thông tin liên hệ */}
              <div className="bg-zinc-50 p-4 rounded-xl border border-[#E4E4E7] space-y-2 text-xs">
                <div className="flex items-center gap-2 text-zinc-700">
                  <Phone size={14} className="text-zinc-400" />
                  <span className="font-mono">{selectedCustomer.phone || "Chưa có SĐT"}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-700">
                  <Mail size={14} className="text-zinc-400" />
                  <span className="font-mono">{selectedCustomer.email || "Chưa có email"}</span>
                </div>
              </div>

              {/* Danh sách các hồ sơ số đo áo dài đã lưu */}
              <div className="space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                  <Ruler size={14} /> Danh sách hồ sơ số đo may riêng
                </div>
                {selectedCustomer.measurements.length === 0 ? (
                  <div className="p-6 text-center bg-zinc-50 rounded-xl border border-zinc-200 text-zinc-400 text-xs">
                    Khách hàng này chưa lưu số đo may đo nào.
                  </div>
                ) : (
                  selectedCustomer.measurements.map((profile) => (
                    <div key={profile.id} className="p-4 bg-white rounded-xl border border-[#E4E4E7] shadow-2xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-zinc-900">{profile.profileName}</span>
                        {profile.isDefault && (
                          <span className="px-2 py-0.5 rounded bg-zinc-900 text-white text-[10px] font-semibold">
                            Mặc định
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-[11px] bg-zinc-50 p-2.5 rounded-lg border border-zinc-200">
                        <div>
                          <span className="text-zinc-400 block text-[9px]">Ngực</span>
                          <span className="font-mono font-bold text-zinc-800">{profile.bust || "--"} cm</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block text-[9px]">Eo</span>
                          <span className="font-mono font-bold text-zinc-800">{profile.waist || "--"} cm</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block text-[9px]">Mông</span>
                          <span className="font-mono font-bold text-zinc-800">{profile.hips || "--"} cm</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block text-[9px]">Dài áo</span>
                          <span className="font-mono font-bold text-zinc-800">{profile.shirtLength || "--"} cm</span>
                        </div>
                      </div>
                      {profile.note && (
                        <div className="text-xs text-zinc-500 italic">
                          Ghi chú: {profile.note}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-[#E4E4E7] pt-4 mt-6 flex justify-between items-center text-xs">
              <span className="text-zinc-500">Tổng doanh thu từ khách:</span>
              <span className="font-mono font-bold text-base text-zinc-900">
                {selectedCustomer.totalSpent.toLocaleString("vi-VN")} ₫
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
