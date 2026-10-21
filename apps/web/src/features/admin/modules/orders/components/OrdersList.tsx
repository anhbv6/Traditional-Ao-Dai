"use client";

import React, { useState, useTransition } from "react";
import { type AdminOrderItem, type OrderStatus} from "../types/orders.types";
import { updateOrderStatusAction} from "../actions/orders.actions";
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle, 
  Scissors, 
  Search, 
  Filter, 
  ChevronRight,
  User,
  
  MapPin,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

interface OrdersListProps {
  initialOrders: AdminOrderItem[];
}

const statusBadges: Record<OrderStatus, { label: string; bg: string; text: string; icon: LucideIcon }> = {
  PENDING: { label: "Chờ xác nhận", bg: "bg-amber-50 border-amber-200", text: "text-amber-700", icon: Clock },
  CONFIRMED: { label: "Đã xác nhận", bg: "bg-blue-50 border-blue-200", text: "text-blue-700", icon: CheckCircle2 },
  IN_PRODUCTION: { label: "Đang may đo", bg: "bg-purple-50 border-purple-200", text: "text-purple-700", icon: Scissors },
  READY_TO_SHIP: { label: "Chờ xuất kho", bg: "bg-indigo-50 border-indigo-200", text: "text-indigo-700", icon: Package },
  SHIPPING: { label: "Đang giao", bg: "bg-sky-50 border-sky-200", text: "text-sky-700", icon: Truck },
  DELIVERED: { label: "Giao thành công", bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-700", icon: CheckCircle2 },
  CANCELLED: { label: "Đã hủy", bg: "bg-rose-50 border-rose-200", text: "text-rose-700", icon: XCircle },
  REFUNDED: { label: "Đã hoàn tiền", bg: "bg-zinc-100 border-zinc-300", text: "text-zinc-700", icon: XCircle },
};

export function OrdersList({ initialOrders }: OrdersListProps) {
  const [orders, setOrders] = useState<AdminOrderItem[]>(initialOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [selectedOrder, setSelectedOrder] = useState<AdminOrderItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerPhone.includes(searchTerm);

    const matchesStatus =
      selectedStatus === "ALL" || order.orderStatus === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, newStatus);
      if (res.success) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, orderStatus: newStatus } : o))
        );
        if (selectedOrder?.id === orderId) {
          setSelectedOrder((prev) => prev ? { ...prev, orderStatus: newStatus } : null);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-xl border border-[#E4E4E7] shadow-2xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Tìm theo mã đơn, tên, SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-[#E4E4E7] rounded-lg text-sm focus:outline-none focus:border-zinc-900 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <Filter size={15} className="text-[#71717A] shrink-0" />
          {["ALL", "PENDING", "CONFIRMED", "IN_PRODUCTION", "SHIPPING", "DELIVERED"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                selectedStatus === st
                  ? "bg-[#18181B] text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {st === "ALL" ? "Tất cả" : statusBadges[st as OrderStatus]?.label || st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-[#E4E4E7] shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#E4E4E7] bg-zinc-50/50 text-[11px] font-semibold text-[#71717A] uppercase tracking-wider">
                <th className="py-3 px-4">Mã đơn hàng</th>
                <th className="py-3 px-4">Khách hàng</th>
                <th className="py-3 px-4">Sản phẩm / Dịch vụ</th>
                <th className="py-3 px-4">Tổng tiền</th>
                <th className="py-3 px-4">Thanh toán</th>
                <th className="py-3 px-4">Trạng thái đơn</th>
                <th className="py-3 px-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7] text-sm">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[#71717A]">
                    <Package className="mx-auto size-8 text-zinc-300 mb-2" />
                    Chưa có đơn hàng nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const badge = statusBadges[order.orderStatus];
                  const BadgeIcon = badge?.icon || Package;
                  const hasCustomFit = order.items.some((i) => i.isCustomFit);

                  return (
                    <tr 
                      key={order.id} 
                      className="hover:bg-zinc-50/80 transition-colors cursor-pointer"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <td className="py-3.5 px-4 font-mono font-semibold text-xs text-[#09090B]">
                        {order.orderNumber}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-[#09090B]">{order.customerName}</div>
                        <div className="text-xs text-[#71717A] font-mono">{order.customerPhone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-zinc-800 font-medium">
                            {order.items.length} món
                          </span>
                          {hasCustomFit && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 text-[10px] font-semibold border border-purple-200">
                              <Sparkles size={10} /> May đo riêng
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-[#09090B]">
                        {Number(order.totalAmount).toLocaleString("vi-VN")} ₫
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${
                          order.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : order.paymentStatus === "PARTIALLY_PAID"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-zinc-100 text-zinc-600 border border-[#E4E4E7]"
                        }`}>
                          {order.paymentStatus === "PAID" ? "Đã thanh toán" : order.paymentStatus === "PARTIALLY_PAID" ? "Đã cọc" : "Chưa thanh toán"}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge?.bg} ${badge?.text}`}>
                          <BadgeIcon size={12} />
                          {badge?.label}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button className="p-1.5 text-zinc-400 hover:text-[#09090B] rounded-lg hover:bg-zinc-100 transition-colors">
                          <ChevronRight size={16} />
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

      {/* Drawer / Modal Chi tiết đơn hàng */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto p-6 flex flex-col justify-between animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#E4E4E7] pb-4">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#71717A]">Chi tiết đơn hàng</div>
                  <h3 className="text-lg font-bold font-mono text-[#09090B]">{selectedOrder.orderNumber}</h3>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1.5 text-zinc-400 hover:text-[#09090B] rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                >
                  <XCircle size={20} />
                </button>
              </div>

              {/* Thông tin người nhận */}
              <div className="bg-zinc-50 rounded-xl p-4 border border-[#E4E4E7] space-y-2">
                <div className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">Khách hàng & Địa chỉ</div>
                <div className="flex items-center gap-2 text-sm font-medium text-[#09090B]">
                  <User size={14} className="text-[#71717A]" />
                  {selectedOrder.customerName} ({selectedOrder.customerPhone})
                </div>
                <div className="flex items-start gap-2 text-xs text-zinc-600">
                  <MapPin size={14} className="text-[#71717A] shrink-0 mt-0.5" />
                  {selectedOrder.shippingAddress}
                </div>
              </div>

              {/* Danh sách áo dài trong đơn */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">Danh mục áo dài</div>
                <div className="space-y-2">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="p-3 bg-white rounded-lg border border-[#E4E4E7] flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-sm text-[#09090B]">{item.productName}</div>
                        <div className="text-xs text-[#71717A]">
                          {item.variantName ? `Size: ${item.variantName}` : "May đo"} | SL: {item.quantity}
                        </div>
                        {item.isCustomFit && (
                          <div className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-purple-700">
                            <Scissors size={11} /> Đã tiếp nhận số đo may riêng
                          </div>
                        )}
                      </div>
                      <div className="font-mono font-semibold text-sm text-[#09090B]">
                        {Number(item.totalPrice).toLocaleString("vi-VN")} ₫
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Thao tác chuyển trạng thái */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-[#71717A] uppercase tracking-wider">Cập nhật tiến trình đơn</div>
                <div className="grid grid-cols-2 gap-2">
                  {(["CONFIRMED", "IN_PRODUCTION", "READY_TO_SHIP", "SHIPPING", "DELIVERED"] as OrderStatus[]).map((st) => (
                    <button
                      key={st}
                      disabled={isPending || selectedOrder.orderStatus === st}
                      onClick={() => handleStatusChange(selectedOrder.id, st)}
                      className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        selectedOrder.orderStatus === st
                          ? "bg-[#18181B] text-white border-zinc-900"
                          : "bg-white text-zinc-700 border-[#E4E4E7] hover:bg-zinc-50 hover:border-zinc-300"
                      }`}
                    >
                      {statusBadges[st]?.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-[#E4E4E7] pt-4 mt-6 flex justify-between items-center">
              <span className="text-xs text-[#71717A]">Tổng cộng thanh toán</span>
              <span className="font-mono font-bold text-lg text-[#09090B]">
                {Number(selectedOrder.totalAmount).toLocaleString("vi-VN")} ₫
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
