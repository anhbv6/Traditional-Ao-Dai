import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, User, Scissors, CreditCard } from "lucide-react";
import { type OrderItem, type OrderStatus } from "../types/dashboard.types";

interface DashboardOrderDetailDrawerProps {
  selectedOrder: OrderItem | null;
  onClose: () => void;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  labels: {
    detailTitle: string;
    updateStatus: string;
    customerInfo: string;
    tailorSpecs: string;
    statusLabels: Record<OrderStatus, string>;
  };
}

export function DashboardOrderDetailDrawer({
  selectedOrder,
  onClose,
  onUpdateStatus,
  labels,
}: DashboardOrderDetailDrawerProps) {
  return (
    <AnimatePresence>
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-hidden select-none">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.4 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
          />

          {/* Sliding Drawer Container */}
          <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="w-screen max-w-md bg-white border-l border-[#E4E4E7] flex flex-col justify-between shadow-2xl relative"
            >
              {/* Header */}
              <div className="border-b border-[#E4E4E7] bg-[#FAFAFA] px-6 py-5 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-[#09090B]">
                    {labels.detailTitle}
                  </h3>
                  <p className="text-xs text-[#71717A] mt-0.5 font-mono">
                    Đơn hàng #{selectedOrder.id} • {selectedOrder.date}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="rounded-lg p-1.5 text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B] transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Status update widget */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#71717A]">
                    {labels.updateStatus}
                  </label>
                  <div className="relative">
                    <select
                      value={selectedOrder.status}
                      onChange={(e) =>
                        onUpdateStatus(selectedOrder.id, e.target.value as OrderStatus)
                      }
                      className="w-full rounded-lg border border-[#E4E4E7] bg-white px-4 py-3 text-sm font-semibold text-[#09090B] outline-none shadow-sm focus:border-[#09090B] focus:ring-1 focus:ring-[#09090B] cursor-pointer"
                    >
                      {(["pending_approval", "cutting_fabric", "sewing_job", "completed", "shipping"] as OrderStatus[]).map(
                        (status) => (
                          <option key={status} value={status} className="text-[#09090B]">
                            {labels.statusLabels[status]}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                {/* Customer Info Card */}
                <div className="rounded-lg border border-[#E4E4E7] p-4 space-y-3 bg-[#FAFAFA]/60">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.5px] text-[#09090B] flex items-center gap-1.5 border-b border-[#E4E4E7] pb-2">
                    <User size={13} />
                    {labels.customerInfo}
                  </h4>
                  <div className="text-xs space-y-1.5 text-[#09090B]">
                    <p className="flex justify-between">
                      <span className="text-[#71717A]">Họ tên:</span>
                      <span className="font-semibold">{selectedOrder.customer}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-[#71717A]">SĐT:</span>
                      <span className="font-semibold font-mono">{selectedOrder.phone}</span>
                    </p>
                    <p className="flex justify-between gap-4">
                      <span className="text-[#71717A] shrink-0">Địa chỉ:</span>
                      <span className="font-semibold text-right leading-relaxed">{selectedOrder.address}</span>
                    </p>
                  </div>
                </div>

                {/* Custom specs */}
                {selectedOrder.type === "custom" && selectedOrder.measurements && (
                  <div className="rounded-lg border border-[#E4E4E7] p-4 space-y-3 bg-[#FAFAFA]/60">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.5px] text-[#09090B] flex items-center gap-1.5 border-b border-[#E4E4E7] pb-2">
                      <Scissors size={13} />
                      {labels.tailorSpecs}
                    </h4>
                    <div className="grid grid-cols-2 gap-3.5 text-xs text-[#09090B]">
                      <p className="flex justify-between border-b border-[#E4E4E7] pb-1">
                        <span className="text-[#71717A]">Chiều cao:</span>
                        <span className="font-semibold font-mono">{selectedOrder.measurements.height}</span>
                      </p>
                      <p className="flex justify-between border-b border-[#E4E4E7] pb-1">
                        <span className="text-[#71717A]">Cân nặng:</span>
                        <span className="font-semibold font-mono">{selectedOrder.measurements.weight}</span>
                      </p>
                      <p className="flex justify-between border-b border-[#E4E4E7] pb-1">
                        <span className="text-[#71717A]">Vòng ngực:</span>
                        <span className="font-semibold font-mono">{selectedOrder.measurements.bust}</span>
                      </p>
                      <p className="flex justify-between border-b border-[#E4E4E7] pb-1">
                        <span className="text-[#71717A]">Vòng eo:</span>
                        <span className="font-semibold font-mono">{selectedOrder.measurements.waist}</span>
                      </p>
                      <p className="flex justify-between border-b border-[#E4E4E7] pb-1 col-span-2">
                        <span className="text-[#71717A]">Vòng hông:</span>
                        <span className="font-semibold font-mono">{selectedOrder.measurements.hips}</span>
                      </p>
                    </div>
                  </div>
                )}

                {/* Order items */}
                <div className="space-y-3">
                  <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#71717A]">
                    Sản phẩm đặt mua
                  </label>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center p-3 rounded-lg border border-[#E4E4E7] text-xs font-semibold text-[#09090B] bg-white shadow-xs"
                      >
                        <div>
                          <p className="text-[#09090B] font-semibold">{item.name}</p>
                          <p className="text-[#71717A] text-[10px] mt-0.5">
                            {item.size ? `Size: ${item.size}` : "May đo riêng"} x {item.quantity}
                          </p>
                        </div>
                        <span className="font-bold font-mono">{item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer summary */}
              <div className="border-t border-[#E4E4E7] bg-[#FAFAFA] p-6 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-1.5 font-semibold text-xs text-[#71717A]">
                  <CreditCard size={14} />
                  <span>Tổng tiền thu</span>
                </div>
                <span className="text-xl font-bold text-[#09090B] font-mono">
                  {selectedOrder.total}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
