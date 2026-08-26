"use client";

import { useState, useMemo } from "react";
import {
  type FilterType,
  type OrderItem,
  type OrderStatus,
  type StatItem,
  type PieDataItem,
} from "../types/dashboard.types";

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

const pieData: PieDataItem[] = [
  { name: "Áo Dài Gấm Song Hỷ", value: 38, color: "#09090B" },
  { name: "Áo Dài Tơ Tằm Cổ Điển", value: 25, color: "#27272A" },
  { name: "Áo Dài Nhung Đỏ", value: 22, color: "#71717A" },
  { name: "Áo Dài Cách Tân", value: 15, color: "#E4E4E7" },
];

export function useAdminDashboard() {
  const [filter, setFilter] = useState<FilterType>("week");
  const [orders, setOrders] = useState<OrderItem[]>(initialOrders);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const stats = useMemo(() => mockStats[filter], [filter]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleUpdateStatus = (orderId: string, nextStatus: OrderStatus) => {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }
    showToast(`Đã chuyển đơn hàng ${orderId} sang trạng thái mới thành công!`);
  };

  const getStatusColor = (status: OrderStatus) => {
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

  return {
    filter,
    setFilter,
    orders,
    selectedOrder,
    setSelectedOrder,
    toastMsg,
    stats,
    pieData,
    showToast,
    handleUpdateStatus,
    getStatusColor,
  };
}
