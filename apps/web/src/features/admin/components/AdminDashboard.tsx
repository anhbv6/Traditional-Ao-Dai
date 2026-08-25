"use client";

import React, { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import {
  TrendingUp,
  ShoppingBag,
  Clock,
  Scissors,
  Activity,
  ChevronRight,
  AlertTriangle,
  User,
  CheckCircle2,
  X,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "motion/react";

type FilterType = "today" | "week" | "month";

interface StatItem {
  revenue: string;
  revenueDiff: string;
  orders: number;
  ordersDiff: string;
  pending: number;
  customRatio: number; // e.g. 65 means 65% custom, 35% ready
}

interface OrderItem {
  id: string;
  customer: string;
  type: "custom" | "ready";
  total: string;
  status: "pending_approval" | "cutting_fabric" | "sewing_job" | "completed" | "shipping";
  date: string;
  items: Array<{ name: string; price: string; quantity: number; size?: string }>;
  phone: string;
  address: string;
  measurements?: {
    height: string;
    weight: string;
    bust: string;
    waist: string;
    hips: string;
    neckToWaist: string;
  };
}

const mockStats: Record<FilterType, StatItem> = {
  today: {
    revenue: "12.890.000 ₫",
    revenueDiff: "+18.4%",
    orders: 6,
    ordersDiff: "+2 đơn",
    pending: 3,
    customRatio: 80,
  },
  week: {
    revenue: "94.500.000 ₫",
    revenueDiff: "+12.2%",
    orders: 48,
    ordersDiff: "+10 đơn",
    pending: 12,
    customRatio: 68,
  },
  month: {
    revenue: "389.200.000 ₫",
    revenueDiff: "+15.6%",
    orders: 196,
    ordersDiff: "+24 đơn",
    pending: 18,
    customRatio: 62,
  },
};

const initialOrders: OrderItem[] = [
  {
    id: "AD-10901",
    customer: "Nguyễn Thị Thảo",
    type: "custom",
    total: "3.780.000 ₫",
    status: "cutting_fabric",
    date: "14:32 Hôm nay",
    phone: "0912 345 678",
    address: "15 Trúc Bạch, Ba Đình, Hà Nội",
    items: [{ name: "Áo Dài Gấm Song Hỷ", price: "1.890.000 ₫", quantity: 2 }],
    measurements: {
      height: "162 cm",
      weight: "50 kg",
      bust: "84 cm",
      waist: "64 cm",
      hips: "89 cm",
      neckToWaist: "36 cm",
    },
  },
  {
    id: "AD-10902",
    customer: "Trần Văn Bình",
    type: "ready",
    total: "2.450.000 ₫",
    status: "pending_approval",
    date: "12:15 Hôm nay",
    phone: "0987 654 321",
    address: "Tòa nhà Metropolitan, Quận 1, TP. HCM",
    items: [{ name: "Áo Dài Tơ Tằm Cổ Điển", price: "2.450.000 ₫", quantity: 1, size: "M" }],
  },
  {
    id: "AD-10895",
    customer: "Phạm Minh Thư",
    type: "custom",
    total: "6.400.000 ₫",
    status: "sewing_job",
    date: "Hôm qua",
    phone: "0909 112 233",
    address: "48 Hàng Bạc, Hoàn Kiếm, Hà Nội",
    items: [{ name: "Áo Dài Nhung Đỏ Quý Phái", price: "3.200.000 ₫", quantity: 2 }],
    measurements: {
      height: "158 cm",
      weight: "48 kg",
      bust: "82 cm",
      waist: "62 cm",
      hips: "88 cm",
      neckToWaist: "35 cm",
    },
  },
  {
    id: "AD-10892",
    customer: "Lê Hoài Nam",
    type: "ready",
    total: "1.290.000 ₫",
    status: "completed",
    date: "2 ngày trước",
    phone: "0915 556 677",
    address: "244 Lê Lợi, Quận Hải Châu, Đà Nẵng",
    items: [{ name: "Áo Dài Cách Tân Hoa Đào", price: "1.290.000 ₫", quantity: 1, size: "L" }],
  },
  {
    id: "AD-10887",
    customer: "Hoàng Ngân Hà",
    type: "custom",
    total: "3.200.000 ₫",
    status: "shipping",
    date: "3 ngày trước",
    phone: "0934 998 877",
    address: "Ngõ 19 Láng Hạ, Đống Đa, Hà Nội",
    items: [{ name: "Áo Dài Nhung Đỏ Quý Phái", price: "3.200.000 ₫", quantity: 1 }],
    measurements: {
      height: "165 cm",
      weight: "52 kg",
      bust: "86 cm",
      waist: "66 cm",
      hips: "92 cm",
      neckToWaist: "37 cm",
    },
  },
];

export function AdminDashboard() {
  const t = useTranslations("AdminPage");
  const [filter, setFilter] = useState<FilterType>("week");
  const [orders, setOrders] = useState<OrderItem[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const stats = useMemo(() => mockStats[filter], [filter]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleUpdateStatus = (orderId: string, nextStatus: OrderItem["status"]) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }
    showToast(`Đã chuyển đơn hàng ${orderId} sang trạng thái mới thành công!`);
  };

  const getStatusColor = (status: OrderItem["status"]) => {
    switch (status) {
      case "pending_approval":
        return "bg-amber-50/50 text-amber-800 border-amber-200";
      case "cutting_fabric":
        return "bg-blue-50/50 text-blue-800 border-blue-200";
      case "sewing_job":
        return "bg-indigo-50/50 text-indigo-800 border-indigo-200";
      case "completed":
        return "bg-emerald-50/50 text-emerald-800 border-emerald-200";
      case "shipping":
        return "bg-purple-50/50 text-purple-800 border-purple-200";
    }
  };

  // Pie chart calculation helper
  const pieData = [
    { name: "Áo Dài Gấm Song Hỷ", value: 38, color: "#09090B" },
    { name: "Áo Dài Tơ Tằm Cổ Điển", value: 25, color: "#27272A" },
    { name: "Áo Dài Nhung Đỏ", value: 22, color: "#71717A" },
    { name: "Áo Dài Cách Tân", value: 15, color: "#E4E4E7" },
  ];

  return (
    <Container as="section" className="py-12 bg-[#FAFAFA] min-h-screen relative overflow-x-hidden text-[#09090B]">
      <Breadcrumbs />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full bg-white border border-[#E4E4E7] px-6 py-3.5 shadow-md select-none"
          >
            <CheckCircle2 size={18} className="text-[#09090B] shrink-0" />
            <span className="text-xs font-semibold text-[#09090B] whitespace-nowrap">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title & Filter Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#09090B]">
            {t("title")}
          </h1>
          <p className="mt-1 text-xs text-[#71717A]">
            {t("subtitle")}
          </p>
        </div>

        {/* Dashboard Filter Toggle */}
        <div className="flex bg-white border border-[#E4E4E7] p-1 rounded-lg gap-1 shadow-xs shrink-0 self-start md:self-center select-none">
          {(["today", "week", "month"] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                "px-4 py-2 text-xs font-semibold uppercase tracking-[0.5px] rounded-md transition-all duration-200 cursor-pointer",
                filter === type
                  ? "bg-[#18181B] text-white"
                  : "text-[#71717A] hover:text-[#09090B]"
              )}
            >
              {t(`filters.${type}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards Section */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10 w-full max-w-full">
        {/* Doanh thu */}
        <div className="rounded-xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-[0.5px] text-[#71717A]">{t("stats.revenue")}</span>
            <div className="grid size-9 place-items-center rounded-lg bg-[#F4F4F5] text-[#09090B]">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold tracking-tight text-[#09090B] font-mono">{stats.revenue}</h3>
            <p className="mt-1 text-xs font-normal text-emerald-700 flex items-center gap-1">
              <span>{stats.revenueDiff}</span>
              <span className="text-[#71717A]">so với trước</span>
            </p>
          </div>
        </div>

        {/* Tổng đơn hàng */}
        <div className="rounded-xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-[0.5px] text-[#71717A]">{t("stats.orders")}</span>
            <div className="grid size-9 place-items-center rounded-lg bg-[#F4F4F5] text-[#09090B]">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold tracking-tight text-[#09090B] font-mono">{stats.orders}</h3>
            <p className="mt-1 text-xs font-normal text-emerald-700 flex items-center gap-1">
              <span>{stats.ordersDiff}</span>
              <span className="text-[#71717A]">so với trước</span>
            </p>
          </div>
        </div>

        {/* Chờ xử lý */}
        <div className="rounded-xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold uppercase tracking-[0.5px] text-[#71717A]">{t("stats.pending")}</span>
            <div className="grid size-9 place-items-center rounded-lg bg-[#F4F4F5] text-[#09090B]">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-3xl font-bold tracking-tight text-[#09090B] font-mono">{stats.pending}</h3>
            <p className="mt-1 text-xs text-[#71717A]">Cần hoàn thiện may đo gấp</p>
          </div>
        </div>

        {/* Tỷ lệ may sẵn/may đo */}
        <div className="rounded-xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold uppercase tracking-[0.5px] text-[#71717A]">{t("stats.ratio")}</span>
            <div className="grid size-9 place-items-center rounded-lg bg-[#F4F4F5] text-[#09090B]">
              <Scissors size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-[#09090B] mb-1.5">
              <span>{t("stats.ratioCustom")} ({stats.customRatio}%)</span>
              <span>{t("stats.ratioReady")} ({100 - stats.customRatio}%)</span>
            </div>
            {/* Custom Dual Progress Bar */}
            <div className="w-full h-2.5 rounded-full bg-[#F4F4F5] overflow-hidden border border-[#E4E4E7] flex">
              <div style={{ width: `${stats.customRatio}%` }} className="bg-[#09090B] h-full" />
              <div style={{ width: `${100 - stats.customRatio}%` }} className="bg-[#71717A] h-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Charts & In-depth Analytics + Warnings */}
      <div className="grid gap-6 lg:grid-cols-3 mb-10 w-full max-w-full">
        {/* Collection Revenue Share Donut Chart */}
        <div className="rounded-xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between lg:col-span-2">
          <div>
            <h3 className="text-lg font-semibold text-[#09090B]">
              Phân tích Bộ sưu tập Áo Dài bán chạy
            </h3>
            <p className="text-xs text-[#71717A] mt-0.5">Tỷ lệ đóng góp doanh thu theo từng dòng chất liệu.</p>
          </div>

          <div className="grid md:grid-cols-2 items-center gap-8 mt-6">
            {/* Donut Chart SVG */}
            <div className="relative flex justify-center items-center">
              <svg className="size-44" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F4F4F5" strokeWidth="12" />
                {/* Custom dash arrays to simulate donut slices */}
                {/* Slice 1: 38% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#09090B"
                  strokeWidth="12"
                  strokeDasharray="90.7 238.7"
                  strokeDashoffset="0"
                />
                {/* Slice 2: 25% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#27272A"
                  strokeWidth="12"
                  strokeDasharray="59.7 238.7"
                  strokeDashoffset="-90.7"
                />
                {/* Slice 3: 22% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#71717A"
                  strokeWidth="12"
                  strokeDasharray="52.5 238.7"
                  strokeDashoffset="-150.4"
                />
                {/* Slice 4: 15% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#E4E4E7"
                  strokeWidth="12"
                  strokeDasharray="35.8 238.7"
                  strokeDashoffset="-202.9"
                />
              </svg>
              {/* Centered overall indicator */}
              <div className="absolute flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#71717A]">Tổng quan</span>
                <span className="text-xl font-bold text-[#09090B] font-mono mt-0.5">100%</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3.5">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <span className="size-3.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[#09090B]">{item.name}</span>
                  </div>
                  <span className="text-[#09090B] font-bold font-mono">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Warnings: Low Stock Alert Area */}
        <div className="rounded-xl border border-[#E4E4E7] bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#09090B] flex items-center gap-2">
              <AlertTriangle size={18} className="text-[#09090B]" />
              Cảnh báo Vận hành & Kho vải
            </h3>
            <p className="text-xs text-[#71717A] mt-0.5">Vật liệu và sản phẩm cần bổ sung khẩn cấp.</p>
          </div>

          <div className="space-y-4 mt-6 overflow-y-auto max-h-[220px] scrollbar-thin">
            {/* Warning 1 */}
            <div className="p-3.5 rounded-lg border border-amber-200 bg-amber-50/30 flex gap-3.5">
              <AlertTriangle size={18} className="text-amber-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider">{t("alerts.lowFabrics")}</h4>
                <p className="text-xs font-semibold text-[#09090B] mt-1">Lụa tơ tằm đỏ đô (Mã LH-09)</p>
                <p className="text-[10px] text-[#71717A] mt-0.5">Còn 12m - Thấp hơn mức tối thiểu để phục vụ 8 đơn may đo.</p>
              </div>
            </div>

            {/* Warning 2 */}
            <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/30 flex gap-3.5">
              <AlertTriangle size={18} className="text-rose-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">{t("alerts.lowStock")}</h4>
                <p className="text-xs font-semibold text-[#09090B] mt-1">Áo Dài Cách Tân Hoa Đào (Size M)</p>
                <p className="text-[10px] text-[#71717A] mt-0.5">Còn 2 sản phẩm - Mẫu áo bán chạy đang thiếu size phổ biến.</p>
              </div>
            </div>

            {/* Warning 3 */}
            <div className="p-3.5 rounded-lg border border-rose-200 bg-rose-50/30 flex gap-3.5">
              <AlertTriangle size={18} className="text-rose-700 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">{t("alerts.lowStock")}</h4>
                <p className="text-xs font-semibold text-[#09090B] mt-1">Áo Dài Gấm Song Hỷ (Size S)</p>
                <p className="text-[10px] text-[#71717A] mt-0.5">Còn 3 sản phẩm - Cần nhập thêm gấp.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Tailoring Job Monitor */}
      <div className="rounded-xl border border-[#E4E4E7] bg-white p-6 shadow-sm mb-10 w-full max-w-full">
        <div className="border-b border-[#E4E4E7] pb-5 mb-6 flex items-center gap-2.5">
          <Activity size={20} className="text-[#09090B]" />
          <div>
            <h3 className="text-lg font-semibold text-[#09090B]">
              Theo dõi Tiến độ May đo (Bespoke Workflow)
            </h3>
            <p className="text-xs text-[#71717A]">Tiến độ cắt rập, ráp khâu thủ công của thợ may nghệ nhân.</p>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {orders
              .filter((o) => o.type === "custom" && o.status !== "completed")
              .map((order) => {
                const getProgressPercent = (status: OrderItem["status"]) => {
                  switch (status) {
                    case "pending_approval":
                      return 15;
                    case "cutting_fabric":
                      return 40;
                    case "sewing_job":
                      return 70;
                    case "shipping":
                      return 90;
                    default:
                      return 100;
                  }
                };

                const getStepName = (status: OrderItem["status"]) => {
                  switch (status) {
                    case "pending_approval":
                      return t("alerts.tailorStep.measuring");
                    case "cutting_fabric":
                      return t("alerts.tailorStep.cutting");
                    case "sewing_job":
                      return t("alerts.tailorStep.sewing");
                    case "shipping":
                      return t("alerts.tailorStep.embellishing");
                    default:
                      return t("alerts.tailorStep.finishing");
                  }
                };

                const progress = getProgressPercent(order.status);

                return (
                  <div key={order.id} className="p-4 rounded-lg border border-[#E4E4E7] bg-[#FAFAFA]/50 flex flex-col justify-between gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#09090B] bg-[#F4F4F5] px-2 py-0.5 rounded font-mono">
                        {order.id}
                      </span>
                      <span className="text-xs font-semibold text-[#09090B]">{order.customer}</span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-semibold text-[#09090B] mb-1.5">
                        <span>{getStepName(order.status)}</span>
                        <span className="font-mono">{progress}%</span>
                      </div>
                      {/* Progress Bar */}
                      <div className="w-full h-2 rounded-full bg-[#F4F4F5] overflow-hidden border border-[#E4E4E7]">
                        <div style={{ width: `${progress}%` }} className="bg-[#09090B] h-full" />
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-[11px] text-[#71717A]">
                      <span>Số đo: Ngực {order.measurements?.bust} • Eo {order.measurements?.waist}</span>
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-[#09090B] font-bold uppercase tracking-[0.5px] hover:underline cursor-pointer"
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                );
              })}
        </div>
      </div>

      {/* Latest Orders Area */}
      <div className="rounded-xl border border-[#E4E4E7] bg-white p-6 shadow-sm sm:p-8">
        <div className="border-b border-[#E4E4E7] pb-5 mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#09090B]">
            {t("orders.title")}
          </h3>
          <span className="text-[10px] font-bold text-white bg-[#09090B] px-3 py-1 rounded-full uppercase tracking-[0.5px] select-none font-mono">
            Live
          </span>
        </div>

        <div className="overflow-x-auto w-full min-w-0">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E4E4E7] text-sm font-semibold uppercase tracking-[0.5px] text-[#71717A]">
                <th className="pb-4 pr-4">{t("orders.orderId")}</th>
                <th className="pb-4 pr-4">{t("orders.customer")}</th>
                <th className="pb-4 pr-4">{t("orders.type")}</th>
                <th className="pb-4 pr-4">{t("orders.total")}</th>
                <th className="pb-4 pr-4">{t("orders.status")}</th>
                <th className="pb-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E4E7] text-sm text-[#09090B]">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[#FAFAFA]/70 transition-colors">
                  <td className="py-4 pr-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
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
                      {order.type === "custom" ? t("orders.typeCustom") : t("orders.typeReady")}
                    </span>
                  </td>
                  <td className="py-4 pr-4 font-bold font-mono text-[#09090B]">{order.total}</td>
                  <td className="py-4 pr-4">
                    <span
                      className={`inline-flex items-center rounded border px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {t(`orders.statusLabels.${order.status}`)}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-[#E4E4E7] text-[#09090B] hover:bg-[#09090B] hover:text-white transition-all cursor-pointer"
                    >
                      <ChevronRight size={15} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer: Detailed Order Handler Drawer Panel */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 z-50 overflow-hidden select-none">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
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
                      {t("orders.detailTitle")}
                    </h3>
                    <p className="text-xs text-[#71717A] mt-0.5 font-mono">
                      Đơn hàng #{selectedOrder.id} • {selectedOrder.date}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="rounded-lg p-1.5 text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B] transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Status update widget */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-[0.5px] text-[#71717A]">
                      {t("orders.updateStatus")}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedOrder.status}
                        onChange={(e) =>
                          handleUpdateStatus(selectedOrder.id, e.target.value as OrderItem["status"])
                        }
                        className="w-full rounded-lg border border-[#E4E4E7] bg-white px-4 py-3 text-sm font-semibold text-[#09090B] outline-none shadow-sm focus:border-[#09090B] focus:ring-1 focus:ring-[#09090B] cursor-pointer"
                      >
                        {(["pending_approval", "cutting_fabric", "sewing_job", "completed", "shipping"] as OrderItem["status"][]).map(
                          (status) => (
                            <option key={status} value={status} className="text-[#09090B]">
                              {t(`orders.statusLabels.${status}`)}
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
                      {t("orders.customerInfo")}
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

                  {/* Custom spec specs */}
                  {selectedOrder.type === "custom" && selectedOrder.measurements && (
                    <div className="rounded-lg border border-[#E4E4E7] p-4 space-y-3 bg-[#FAFAFA]/60">
                      <h4 className="text-xs font-semibold uppercase tracking-[0.5px] text-[#09090B] flex items-center gap-1.5 border-b border-[#E4E4E7] pb-2">
                        <Scissors size={13} />
                        {t("orders.tailorSpecs")}
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
    </Container>
  );
}
