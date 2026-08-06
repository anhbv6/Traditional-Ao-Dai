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
  Layers,
  ChevronDown,
  User,
  MapPin,
  CheckCircle2,
  Calendar,
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
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "cutting_fabric":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "sewing_job":
        return "bg-indigo-50 text-indigo-700 border-indigo-200";
      case "completed":
        return "bg-green-50 text-green-700 border-green-200";
      case "shipping":
        return "bg-purple-50 text-purple-700 border-purple-200";
    }
  };

  // Pie chart calculation helper
  const pieData = [
    { name: "Áo Dài Gấm Song Hỷ", value: 38, color: "#800020" },
    { name: "Áo Dài Tơ Tằm Cổ Điển", value: 25, color: "#E2A79E" },
    { name: "Áo Dài Nhung Đỏ", value: 22, color: "#a855f7" },
    { name: "Áo Dài Cách Tân", value: 15, color: "#706565" },
  ];

  return (
    <Container as="section" className="py-12 bg-[#FAF7F5] min-h-screen relative overflow-x-hidden">
      <Breadcrumbs />

      {/* Toast Notification */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full bg-white border border-[#800020]/15 px-6 py-3.5 shadow-xl select-none"
          >
            <CheckCircle2 size={18} className="text-[#800020] shrink-0" />
            <span className="text-xs font-bold text-[#2A2525] whitespace-nowrap">{toastMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title & Filter Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#800020] sm:text-4xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-sm text-[#706565]">
            {t("subtitle")}
          </p>
        </div>

        {/* Dashboard Filter Toggle */}
        <div className="flex bg-white border border-[#E2D9D2] p-1.5 rounded-xl gap-1.5 shadow-xs shrink-0 self-start md:self-center select-none">
          {(["today", "week", "month"] as FilterType[]).map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type)}
              className={cn(
                "px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-300 cursor-pointer",
                filter === type
                  ? "bg-[#800020] text-white"
                  : "text-[#706565] hover:text-[#800020]"
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
        <div className="rounded-2xl border border-[#800020]/10 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#706565]">{t("stats.revenue")}</span>
            <div className="grid size-9 place-items-center rounded-lg bg-[#800020]/5 text-[#800020]">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#800020]">{stats.revenue}</h3>
            <p className="mt-1 text-xs font-semibold text-green-600 flex items-center gap-1">
              <span>{stats.revenueDiff}</span>
              <span className="text-[#706565] font-normal">so với trước</span>
            </p>
          </div>
        </div>

        {/* Tổng đơn hàng */}
        <div className="rounded-2xl border border-[#800020]/10 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#706565]">{t("stats.orders")}</span>
            <div className="grid size-9 place-items-center rounded-lg bg-[#800020]/5 text-[#800020]">
              <ShoppingBag size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#800020]">{stats.orders}</h3>
            <p className="mt-1 text-xs font-semibold text-green-600 flex items-center gap-1">
              <span>{stats.ordersDiff}</span>
              <span className="text-[#706565] font-normal">so với trước</span>
            </p>
          </div>
        </div>

        {/* Chờ xử lý */}
        <div className="rounded-2xl border border-[#800020]/10 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#706565]">{t("stats.pending")}</span>
            <div className="grid size-9 place-items-center rounded-lg bg-[#800020]/5 text-[#800020]">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[#800020]">{stats.pending}</h3>
            <p className="mt-1 text-xs text-[#706565]">Cần hoàn thiện may đo gấp</p>
          </div>
        </div>

        {/* Tỷ lệ may sẵn/may đo */}
        <div className="rounded-2xl border border-[#800020]/10 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#706565]">{t("stats.ratio")}</span>
            <div className="grid size-9 place-items-center rounded-lg bg-[#800020]/5 text-[#800020]">
              <Scissors size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between text-xs font-bold text-[#2A2525] mb-1.5">
              <span>{t("stats.ratioCustom")} ({stats.customRatio}%)</span>
              <span>{t("stats.ratioReady")} ({100 - stats.customRatio}%)</span>
            </div>
            {/* Custom Dual Progress Bar */}
            <div className="w-full h-3 rounded-full bg-[#FAF7F5] overflow-hidden border border-[#E2D9D2]/40 flex">
              <div style={{ width: `${stats.customRatio}%` }} className="bg-[#800020] h-full" />
              <div style={{ width: `${100 - stats.customRatio}%` }} className="bg-[#E2A79E] h-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Charts & In-depth Analytics + Warnings */}
      <div className="grid gap-6 lg:grid-cols-3 mb-10 w-full max-w-full">
        {/* Collection Revenue Share Donut Chart */}
        <div className="rounded-2xl border border-[#800020]/10 bg-white p-6 shadow-xs flex flex-col justify-between lg:col-span-2">
          <div>
            <h3 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-[#800020]">
              Phân tích Bộ sưu tập Áo Dài bán chạy
            </h3>
            <p className="text-xs text-[#706565] mt-0.5">Tỷ lệ đóng góp doanh thu theo từng dòng chất liệu.</p>
          </div>

          <div className="grid md:grid-cols-2 items-center gap-8 mt-6">
            {/* Donut Chart SVG */}
            <div className="relative flex justify-center items-center">
              <svg className="size-44" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#F5F5F5" strokeWidth="12" />
                {/* Custom dash arrays to simulate donut slices */}
                {/* Slice 1: 38% */}
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="transparent"
                  stroke="#800020"
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
                  stroke="#E2A79E"
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
                  stroke="#a855f7"
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
                  stroke="#706565"
                  strokeWidth="12"
                  strokeDasharray="35.8 238.7"
                  strokeDashoffset="-202.9"
                />
              </svg>
              {/* Centered overall indicator */}
              <div className="absolute flex flex-col items-center">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#706565]">Tổng quan</span>
                <span className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#800020] mt-0.5">100%</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-3.5">
              {pieData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <span className="size-3.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[#2A2525]">{item.name}</span>
                  </div>
                  <span className="text-[#800020] font-bold">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Warnings: Low Stock Alert Area */}
        <div className="rounded-2xl border border-[#800020]/10 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-[family-name:var(--font-playfair)] text-lg font-bold text-[#800020] flex items-center gap-2">
              <AlertTriangle size={18} className="text-[#800020]" />
              Cảnh báo Vận hành & Kho vải
            </h3>
            <p className="text-xs text-[#706565] mt-0.5">Vật liệu và sản phẩm cần bổ sung khẩn cấp.</p>
          </div>

          <div className="space-y-4 mt-6 overflow-y-auto max-h-[220px] scrollbar-thin">
            {/* Warning 1 */}
            <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 flex gap-3.5">
              <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">{t("alerts.lowFabrics")}</h4>
                <p className="text-xs font-medium text-amber-700 mt-1">Lụa tơ tằm đỏ đô (Mã LH-09)</p>
                <p className="text-[10px] text-amber-600/80 mt-0.5">Còn 12m - Thấp hơn mức tối thiểu để phục vụ 8 đơn may đo.</p>
              </div>
            </div>

            {/* Warning 2 */}
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 flex gap-3.5">
              <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider">{t("alerts.lowStock")}</h4>
                <p className="text-xs font-medium text-rose-700 mt-1">Áo Dài Cách Tân Hoa Đào (Size M)</p>
                <p className="text-[10px] text-rose-600/80 mt-0.5">Còn 2 sản phẩm - Mẫu áo bán chạy đang thiếu size phổ biến.</p>
              </div>
            </div>

            {/* Warning 3 */}
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 flex gap-3.5">
              <AlertTriangle size={18} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider">{t("alerts.lowStock")}</h4>
                <p className="text-xs font-medium text-rose-700 mt-1">Áo Dài Gấm Song Hỷ (Size S)</p>
                <p className="text-[10px] text-rose-600/80 mt-0.5">Còn 3 sản phẩm - Cần nhập thêm gấp.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress & Tailoring Job Monitor */}
      <div className="rounded-2xl border border-[#800020]/10 bg-white p-6 shadow-sm mb-10 w-full max-w-full">
        <div className="border-b border-[#E2D9D2]/60 pb-5 mb-6 flex items-center gap-2.5">
          <Activity size={20} className="text-[#800020]" />
          <div>
            <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#800020]">
              Theo dõi Tiến độ May đo (Bespoke Workflow)
            </h3>
            <p className="text-xs text-[#706565]">Tiến độ cắt rập, ráp khâu thủ công của thợ may nghệ nhân.</p>
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
                <div key={order.id} className="p-4 rounded-xl border border-[#E2D9D2]/60 bg-[#FAF7F5]/25 flex flex-col justify-between gap-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#800020] bg-[#800020]/5 px-2 py-0.5 rounded">
                      {order.id}
                    </span>
                    <span className="text-xs font-semibold text-[#706565]">{order.customer}</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-bold text-[#2A2525] mb-1.5">
                      <span>{getStepName(order.status)}</span>
                      <span>{progress}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full h-2 rounded-full bg-[#FAF7F5] overflow-hidden border border-[#E2D9D2]/30">
                      <div style={{ width: `${progress}%` }} className="bg-[#800020] h-full" />
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-[#706565]">
                    <span>Số đo: Ngực {order.measurements?.bust} • Eo {order.measurements?.waist}</span>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-[#800020] font-bold uppercase tracking-wider hover:underline"
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
      <div className="rounded-2xl border border-[#800020]/10 bg-white p-6 shadow-sm sm:p-8">
        <div className="border-b border-[#E2D9D2]/60 pb-5 mb-6 flex items-center justify-between">
          <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#800020]">
            {t("orders.title")}
          </h3>
          <span className="text-xs font-bold text-white bg-[#800020] px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-sm select-none">
            Live
          </span>
        </div>

        <div className="overflow-x-auto w-full min-w-0">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#E2D9D2]/60 text-xs font-semibold uppercase tracking-wider text-[#706565]">
                <th className="pb-4 pr-4">{t("orders.orderId")}</th>
                <th className="pb-4 pr-4">{t("orders.customer")}</th>
                <th className="pb-4 pr-4">{t("orders.type")}</th>
                <th className="pb-4 pr-4">{t("orders.total")}</th>
                <th className="pb-4 pr-4">{t("orders.status")}</th>
                <th className="pb-4 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2D9D2]/40 text-sm text-[#2A2525]">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[#FAF7F5]/35 transition-colors">
                  <td className="py-4.5 pr-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="font-bold text-[#800020] hover:underline cursor-pointer"
                    >
                      {order.id}
                    </button>
                  </td>
                  <td className="py-4.5 pr-4 font-semibold text-[#2A2525]">{order.customer}</td>
                  <td className="py-4.5 pr-4">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        order.type === "custom"
                          ? "bg-[#800020]/10 text-[#800020] border border-[#800020]/15"
                          : "bg-[#706565]/10 text-[#706565] border border-[#706565]/15"
                      }`}
                    >
                      {order.type === "custom" ? t("orders.typeCustom") : t("orders.typeReady")}
                    </span>
                  </td>
                  <td className="py-4.5 pr-4 font-bold text-[#2A2525]">{order.total}</td>
                  <td className="py-4.5 pr-4">
                    <span
                      className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold ${getStatusColor(
                        order.status
                      )}`}
                    >
                      {t(`orders.statusLabels.${order.status}`)}
                    </span>
                  </td>
                  <td className="py-4.5 text-right">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="inline-flex size-8 items-center justify-center rounded-lg border border-[#800020]/15 text-[#800020] hover:bg-[#800020] hover:text-white transition-all cursor-pointer"
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
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedOrder(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Sliding Drawer Container */}
            <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
              <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 220 }}
                className="w-screen max-w-md bg-white border-l border-[#800020]/10 flex flex-col justify-between shadow-2xl relative"
              >
                {/* Header */}
                <div className="border-b border-[#E2D9D2]/60 bg-[#FAF7F5] px-6 py-5 flex items-center justify-between">
                  <div>
                    <h3 className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#800020]">
                      {t("orders.detailTitle")}
                    </h3>
                    <p className="text-xs text-[#706565] mt-0.5">
                      Đơn hàng #{selectedOrder.id} • {selectedOrder.date}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="rounded-lg p-1.5 text-[#706565] hover:bg-[#E2D9D2]/40 transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {/* Status update widget */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#706565]">
                      {t("orders.updateStatus")}
                    </label>
                    <div className="relative">
                      <select
                        value={selectedOrder.status}
                        onChange={(e) =>
                          handleUpdateStatus(selectedOrder.id, e.target.value as OrderItem["status"])
                        }
                        className="w-full rounded-xl border border-[#E2D9D2] bg-white px-4 py-3 text-sm font-semibold text-[#800020] outline-none shadow-sm focus:border-[#800020] focus:ring-1 focus:ring-[#800020] cursor-pointer"
                      >
                        {(["pending_approval", "cutting_fabric", "sewing_job", "completed", "shipping"] as OrderItem["status"][]).map(
                          (status) => (
                            <option key={status} value={status} className="text-[#2A2525]">
                              {t(`orders.statusLabels.${status}`)}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                  </div>

                  {/* Customer Info Card */}
                  <div className="rounded-xl border border-[#E2D9D2]/75 p-4 space-y-3 bg-[#FAF7F5]/20">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#800020] flex items-center gap-1.5 border-b border-[#E2D9D2]/50 pb-2">
                      <User size={13} />
                      {t("orders.customerInfo")}
                    </h4>
                    <div className="text-xs space-y-1.5 text-[#2A2525]">
                      <p className="flex justify-between">
                        <span className="text-[#706565]">Họ tên:</span>
                        <span className="font-semibold">{selectedOrder.customer}</span>
                      </p>
                      <p className="flex justify-between">
                        <span className="text-[#706565]">SĐT:</span>
                        <span className="font-semibold">{selectedOrder.phone}</span>
                      </p>
                      <p className="flex justify-between gap-4">
                        <span className="text-[#706565] shrink-0">Địa chỉ:</span>
                        <span className="font-semibold text-right leading-relaxed">{selectedOrder.address}</span>
                      </p>
                    </div>
                  </div>

                  {/* Custom spec specs */}
                  {selectedOrder.type === "custom" && selectedOrder.measurements && (
                    <div className="rounded-xl border border-[#E2D9D2]/75 p-4 space-y-3 bg-[#FAF7F5]/20">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[#800020] flex items-center gap-1.5 border-b border-[#E2D9D2]/50 pb-2">
                        <Scissors size={13} />
                        {t("orders.tailorSpecs")}
                      </h4>
                      <div className="grid grid-cols-2 gap-3.5 text-xs text-[#2A2525]">
                        <p className="flex justify-between border-b border-[#E2D9D2]/30 pb-1">
                          <span className="text-[#706565]">Chiều cao:</span>
                          <span className="font-semibold">{selectedOrder.measurements.height}</span>
                        </p>
                        <p className="flex justify-between border-b border-[#E2D9D2]/30 pb-1">
                          <span className="text-[#706565]">Cân nặng:</span>
                          <span className="font-semibold">{selectedOrder.measurements.weight}</span>
                        </p>
                        <p className="flex justify-between border-b border-[#E2D9D2]/30 pb-1">
                          <span className="text-[#706565]">Vòng ngực:</span>
                          <span className="font-semibold">{selectedOrder.measurements.bust}</span>
                        </p>
                        <p className="flex justify-between border-b border-[#E2D9D2]/30 pb-1">
                          <span className="text-[#706565]">Vòng eo:</span>
                          <span className="font-semibold">{selectedOrder.measurements.waist}</span>
                        </p>
                        <p className="flex justify-between border-b border-[#E2D9D2]/30 pb-1 col-span-2">
                          <span className="text-[#706565]">Vòng hông:</span>
                          <span className="font-semibold">{selectedOrder.measurements.hips}</span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Order items */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-[#706565]">
                      Sản phẩm đặt mua
                    </label>
                    <div className="space-y-3">
                      {selectedOrder.items.map((item, index) => (
                        <div
                          key={index}
                          className="flex justify-between items-center p-3 rounded-lg border border-[#E2D9D2]/50 text-xs font-semibold text-[#2A2525] bg-white shadow-xs"
                        >
                          <div>
                            <p className="text-[#800020] font-bold">{item.name}</p>
                            <p className="text-[#706565] text-[10px] mt-0.5">
                              {item.size ? `Size: ${item.size}` : "May đo riêng"} x {item.quantity}
                            </p>
                          </div>
                          <span className="font-bold">{item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Footer summary */}
                <div className="border-t border-[#E2D9D2]/60 bg-[#FAF7F5] p-6 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-[#706565]">
                    <CreditCard size={14} />
                    <span>Tổng tiền thu</span>
                  </div>
                  <span className="font-[family-name:var(--font-playfair)] text-xl font-bold text-[#800020]">
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
