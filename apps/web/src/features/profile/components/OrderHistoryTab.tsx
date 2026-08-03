"use client";

import React from "react";
import { useTranslations, useLocale } from "next-intl";
import { ShoppingBag, Eye, Calendar } from "lucide-react";
import Image from "next/image";
import { useOrderHistory } from "../hooks/useProfile";
import { mockOrders } from "../api/profile.api";
import { type Order } from "../types/profile.types";

export function OrderHistoryTab() {
  const t = useTranslations("ProfilePage.orders");
  const locale = useLocale() as "vi" | "en";
  const { selectedOrder, setSelectedOrder } = useOrderHistory();

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "delivered":
        return "bg-green-50 text-green-700 border-green-200";
      case "shipped":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "processing":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "pending":
        return "bg-gray-50 text-gray-700 border-gray-200";
      case "cancelled":
        return "bg-rose-50 text-rose-700 border-rose-200";
    }
  };

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "delivered":
        return t("statusDelivered");
      case "shipped":
        return t("statusShipped");
      case "processing":
        return t("statusProcessing");
      case "pending":
        return t("statusPending");
      case "cancelled":
        return t("statusCancelled");
    }
  };

  return (
    <div className="space-y-6">
      {/* List / Main Panel */}
      <div className="rounded-2xl border border-[#800020]/10 bg-white p-6 shadow-sm sm:p-8">
        <div>
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#800020]">
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-[#706565]">
            {t("subtitle")}
          </p>
        </div>

        {mockOrders.length === 0 ? (
          <div className="my-12 flex flex-col items-center justify-center text-center">
            <ShoppingBag size={48} className="text-[#706565]/35" />
            <p className="mt-4 text-[#706565]">{t("empty")}</p>
          </div>
        ) : (
          <div className="mt-8 overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#E2D9D2]/60 text-xs font-semibold uppercase tracking-wider text-[#706565]">
                  <th className="pb-4 pr-4">{t("orderId")}</th>
                  <th className="pb-4 pr-4">{t("date")}</th>
                  <th className="pb-4 pr-4">{t("status")}</th>
                  <th className="pb-4 pr-4">{t("total")}</th>
                  <th className="pb-4 text-right">{t("action")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2D9D2]/40 text-sm text-[#2A2525]">
                {mockOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-[#FAF7F5]/30">
                    <td className="py-4 pr-4 font-semibold text-[#800020]">
                      #{order.id}
                    </td>
                    <td className="py-4 pr-4 text-[#706565]">{order.date}</td>
                    <td className="py-4 pr-4">
                      <span
                        className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusText(order.status)}
                      </span>
                    </td>
                    <td className="py-4 pr-4 font-medium">{order.total}</td>
                    <td className="py-4 text-right">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex size-9 items-center justify-center rounded-lg border border-[#800020]/15 text-[#800020] hover:bg-[#800020] hover:text-white transition-colors"
                        title={t("viewDetail")}
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal / Detail View */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl overflow-hidden rounded-2xl border border-[#800020]/10 bg-white shadow-xl animate-scale-up">
            {/* Header */}
            <div className="border-b border-[#E2D9D2]/60 bg-[#FAF7F5] px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#800020]">
                  {t("orderId")}: #{selectedOrder.id}
                </h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-[#706565]">
                  <Calendar size={13} />
                  {selectedOrder.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1.5 text-[#706565] hover:bg-[#E2D9D2]/40 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Items */}
            <div className="p-6 space-y-4 max-h-[350px] overflow-y-auto">
              {selectedOrder.items.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-4 rounded-xl border border-[#E2D9D2]/50 p-3 hover:border-[#800020]/20 transition-colors"
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-[#FAF7F5]">
                    <Image
                      src={item.image}
                      alt={item.name[locale]}
                      fill
                      sizes="64px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-center">
                    <h4 className="font-[family-name:var(--font-playfair)] text-sm font-semibold text-[#800020]">
                      {item.name[locale]}
                    </h4>
                    <p className="mt-1 text-xs text-[#706565]">
                      {item.price} x {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Summary */}
            <div className="border-t border-[#E2D9D2]/60 bg-[#FAF7F5] p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-md border px-3 py-1 text-xs font-semibold ${getStatusColor(
                    selectedOrder.status
                  )}`}
                >
                  {getStatusText(selectedOrder.status)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#706565]">{t("total")}</p>
                <p className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#800020]">
                  {selectedOrder.total}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
