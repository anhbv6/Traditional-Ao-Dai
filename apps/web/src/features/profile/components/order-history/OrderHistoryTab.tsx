"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { ShoppingBag, Eye, Calendar as CalendarIcon } from "lucide-react";
import Image from "next/image";
import { useOrderHistory } from "../../hooks/useProfile";
import { mockOrders } from "../../data/mockProfile";
import { type Order } from "../../types/profile.types";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { type DateRange } from "react-day-picker";

export function OrderHistoryTab() {
  const t = useTranslations("ProfilePage.orders");
  const locale = useLocale() as "vi" | "en";
  const { selectedOrder, setSelectedOrder } = useOrderHistory();
  const [activeStatus, setActiveStatus] = useState<"all" | Order["status"]>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

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

  const getOrderDate = (dateStr: string) => {
    return new Date(dateStr + "T00:00:00");
  };

  const getOrderCountByStatus = (status: "all" | Order["status"]) => {
    return mockOrders.filter((order) => {
      const matchesStatus = status === "all" || order.status === status;
      let matchesDate = true;
      if (dateRange) {
        const orderTime = getOrderDate(order.date).getTime();
        if (dateRange.from) {
          const fromDateCopy = new Date(dateRange.from);
          const fromTime = fromDateCopy.setHours(0, 0, 0, 0);
          matchesDate = matchesDate && orderTime >= fromTime;
        }
        if (dateRange.to) {
          const toDateCopy = new Date(dateRange.to);
          const toTime = toDateCopy.setHours(23, 59, 59, 999);
          matchesDate = matchesDate && orderTime <= toTime;
        }
      }
      return matchesStatus && matchesDate;
    }).length;
  };

  const filterTabs: { id: "all" | Order["status"]; label: string }[] = [
    { id: "all", label: t("statusAll") },
    { id: "pending", label: t("statusPending") },
    { id: "processing", label: t("statusProcessing") },
    { id: "shipped", label: t("statusShipped") },
    { id: "delivered", label: t("statusDelivered") },
    { id: "cancelled", label: t("statusCancelled") },
  ];

  const filteredOrders = mockOrders.filter((order) => {
    // 1. Status Filter
    const matchesStatus = activeStatus === "all" || order.status === activeStatus;

    // 2. Date Range Filter
    let matchesDate = true;
    if (dateRange) {
      const orderTime = getOrderDate(order.date).getTime();
      if (dateRange.from) {
        const fromDateCopy = new Date(dateRange.from);
        const fromTime = fromDateCopy.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && orderTime >= fromTime;
      }
      if (dateRange.to) {
        const toDateCopy = new Date(dateRange.to);
        const toTime = toDateCopy.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && orderTime <= toTime;
      }
    }

    return matchesStatus && matchesDate;
  });

  const formatDateRange = (range: DateRange | undefined) => {
    if (!range) return locale === "vi" ? "Chọn khoảng ngày" : "Select date range";
    
    const formatDate = (d: Date | undefined) => {
      if (!d) return "";
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${dd}/${mm}/${yyyy}`;
    };

    if (range.from && range.to) {
      return `${formatDate(range.from)} - ${formatDate(range.to)}`;
    }
    if (range.from) {
      return `${formatDate(range.from)} - ...`;
    }
    return locale === "vi" ? "Chọn khoảng ngày" : "Select date range";
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* List / Main Panel */}
      <div className="rounded-2xl border border-[#800020]/10 bg-white p-5 shadow-sm sm:p-8">
        <div className="border-b border-[#E2D9D2]/40 pb-5">
          <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#800020]">
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-[#706565]">
            {t("subtitle")}
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="mt-5 flex items-center gap-1.5 overflow-x-auto border-b border-[#E2D9D2]/40 pb-px scrollbar-none select-none">
          {filterTabs.map((tab) => {
            const isActive = activeStatus === tab.id;
            const count = getOrderCountByStatus(tab.id);
            return (
              <button
                key={tab.id}
                onClick={() => setActiveStatus(tab.id)}
                className={`relative pb-3 pt-1.5 px-2.5 text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap flex items-center gap-1.5 border-b-2 -mb-px hover:text-[#800020] cursor-pointer ${
                  isActive
                    ? "text-[#800020] border-[#800020]"
                    : "text-[#706565] border-transparent"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] sm:text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-[#800020]/10 text-[#800020]"
                      : "bg-[#FAF7F5] text-[#706565] border border-[#E2D9D2]/40"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Date Range Picker Row */}
        <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-2 border-b border-[#E2D9D2]/20">
          <div className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-[#706565]/80">
            {locale === "vi" ? "Bộ lọc thời gian" : "Date Filter"}
          </div>
          <div className="flex items-center gap-2 z-20">
            <Popover>
              <PopoverTrigger render={
                <button
                  type="button"
                  className="flex h-9 items-center gap-2 rounded-lg border border-[#E2D9D2] bg-white px-3 text-[11px] sm:text-xs font-semibold text-[#706565] hover:border-[#800020] hover:text-[#800020] transition-colors cursor-pointer outline-none shadow-xs"
                >
                  <CalendarIcon size={12} className="text-[#800020]" />
                  <span>{formatDateRange(dateRange)}</span>
                </button>
              } />
              <PopoverContent className="w-auto p-0 bg-white border border-[#E2D9D2] rounded-xl shadow-lg z-50">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                />
              </PopoverContent>
            </Popover>

            {dateRange && (dateRange.from || dateRange.to) && (
              <button
                onClick={() => setDateRange(undefined)}
                className="flex size-9 items-center justify-center rounded-lg border border-[#E2D9D2] bg-white text-[#706565] hover:border-rose-300 hover:text-rose-600 transition-colors cursor-pointer text-xs"
                title="Xóa lọc ngày"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="my-16 flex flex-col items-center justify-center text-center animate-fade-in">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FAF7F5] text-[#706565]/40 border border-[#E2D9D2]/30">
              <ShoppingBag size={24} />
            </div>
            <p className="mt-4 text-xs sm:text-sm text-[#706565] font-medium">{t("empty")}</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="mt-6 hidden sm:block overflow-x-auto">
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
                  {filteredOrders.map((order) => (
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
                          className="inline-flex size-9 items-center justify-center rounded-lg border border-[#800020]/15 text-[#800020] hover:bg-[#800020] hover:text-white transition-colors cursor-pointer"
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

            {/* Mobile Card List View */}
            <div className="mt-4 space-y-3 sm:hidden">
              {filteredOrders.map((order) => (
                <div 
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="rounded-xl border border-[#E2D9D2]/60 bg-[#FAF7F5]/30 p-4 hover:border-[#800020]/30 transition-all duration-300 space-y-3 active:scale-[0.99]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#800020] text-xs">#{order.id}</span>
                    <span
                      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {getStatusText(order.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="block text-[9px] uppercase tracking-wider text-[#706565]/60 mb-0.5">{t("date")}</span>
                      <span className="font-medium text-[#2A2525]">{order.date}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[9px] uppercase tracking-wider text-[#706565]/60 mb-0.5">{t("total")}</span>
                      <span className="font-bold text-[#800020]">{order.total}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E2D9D2]/30 flex justify-end">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#800020]/20 bg-white text-[11px] font-semibold text-[#800020] hover:bg-[#800020] hover:text-white transition-all duration-200 cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>{t("viewDetail")}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal / Detail View */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#800020]/10 bg-white shadow-xl animate-scale-up">
            {/* Header */}
            <div className="border-b border-[#E2D9D2]/60 bg-[#FAF7F5] px-4 py-3 sm:px-6 sm:py-4 flex items-center justify-between">
              <div>
                <h3 className="font-[family-name:var(--font-playfair)] text-base sm:text-lg font-bold text-[#800020]">
                  {t("orderId")}: #{selectedOrder.id}
                </h3>
                <p className="mt-0.5 flex items-center gap-1.5 text-[10px] sm:text-xs text-[#706565]">
                  <CalendarIcon size={12} />
                  {selectedOrder.date}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="rounded-lg p-1.5 text-[#706565] hover:bg-[#E2D9D2]/40 transition-colors cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            {/* Items */}
            <div className="p-4 sm:p-6 space-y-3 max-h-[300px] sm:max-h-[350px] overflow-y-auto">
              {selectedOrder.items.map((item, index) => (
                <div
                  key={index}
                  className="flex gap-3 sm:gap-4 rounded-xl border border-[#E2D9D2]/50 p-2.5 sm:p-3 hover:border-[#800020]/20 transition-colors"
                >
                  <div className="relative size-12 sm:size-16 shrink-0 overflow-hidden rounded-lg bg-[#FAF7F5]">
                    <Image
                      src={item.image}
                      alt={item.name[locale]}
                      fill
                      sizes="(max-width: 640px) 48px, 64px"
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-center min-w-0">
                    <h4 className="font-[family-name:var(--font-playfair)] text-xs sm:text-sm font-semibold text-[#800020] truncate">
                      {item.name[locale]}
                    </h4>
                    <p className="mt-0.5 text-[10px] sm:text-xs text-[#706565]">
                      {item.price} x {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer Summary */}
            <div className="border-t border-[#E2D9D2]/60 bg-[#FAF7F5] p-4 sm:p-6 flex flex-row items-center justify-between gap-4">
              <div className="flex items-center">
                <span
                  className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${getStatusColor(
                    selectedOrder.status
                  )}`}
                >
                  {getStatusText(selectedOrder.status)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-[10px] sm:text-xs text-[#706565]">{t("total")}</p>
                <p className="mt-0.5 font-[family-name:var(--font-playfair)] text-lg sm:text-2xl font-bold text-[#800020]">
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
