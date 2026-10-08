"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { notifySuccess } from "@/lib/messages";
import { useNotify } from "@/hooks/useNotify";
import {
  type FilterType,
  type OrderItem,
  type OrderStatus,
  type StatItem,
  type PieDataItem,
  mapPrismaOrderToOrderItem,
  mapUiStatusToDbStatus,
} from "../types/dashboard.types";
import {
  getDashboardStatsAction,
  getAdminOrdersAction,
  updateOrderStatusAction,
} from "../actions/dashboard.actions";
import { type AdminDashboardOrder } from "../queries/dashboard.queries";

const defaultStats: StatItem = {
  revenue: "0 ₫",
  revenueDiff: "0%",
  orders: 0,
  ordersDiff: "0 đơn",
  pending: 0,
  customRatio: 0,
};

const defaultPieData: PieDataItem[] = [
  { name: "Áo Dài Gấm Song Hỷ", value: 38, color: "#09090B" },
  { name: "Áo Dài Tơ Tằm Cổ Điển", value: 25, color: "#27272A" },
  { name: "Áo Dài Nhung Đỏ", value: 22, color: "#71717A" },
  { name: "Áo Dài Cách Tân", value: 15, color: "#E4E4E7" },
];

const DASHBOARD_ORDERS_KEY = ["admin", "dashboard", "orders"] as const;
const PIE_COLORS = ["#09090B", "#27272A", "#71717A", "#E4E4E7", "#A1A1AA"];

/**
 * Tính phân bổ sản phẩm cho biểu đồ tròn từ danh sách đơn hàng (hàm thuần)
 */
function buildPieData(rawOrders: AdminDashboardOrder[]): PieDataItem[] {
  const productCounts: Record<string, number> = {};
  let totalCount = 0;
  rawOrders.forEach((order) => {
    order.items.forEach((item) => {
      const productName = item.productName || item.product?.name || "Áo Dài";
      productCounts[productName] = (productCounts[productName] || 0) + (item.quantity || 1);
      totalCount += item.quantity || 1;
    });
  });

  if (totalCount === 0) return defaultPieData;

  return Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name, count], idx) => ({
      name,
      value: Math.round((count / totalCount) * 100),
      color: PIE_COLORS[idx % PIE_COLORS.length],
    }));
}

export function useAdminDashboard() {
  const t = useTranslations("AdminPage");
  const queryClient = useQueryClient();
  const notify = useNotify();
  const [filter, setFilter] = useState<FilterType>("week");
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // 1. Số liệu thống kê (Server Action -> Prisma), cache theo bộ lọc thời gian
  const statsQuery = useQuery({
    queryKey: ["admin", "dashboard", "stats", filter],
    queryFn: async () => {
      const res = await getDashboardStatsAction(filter);
      return res.success && res.data ? res.data : defaultStats;
    },
  });

  // 2. Danh sách đơn hàng + phân bổ sản phẩm cho biểu đồ
  const ordersQuery = useQuery({
    queryKey: DASHBOARD_ORDERS_KEY,
    queryFn: async () => {
      const res = await getAdminOrdersAction();
      if (!res.success || !Array.isArray(res.data)) {
        return { orders: [] as OrderItem[], pieData: defaultPieData };
      }
      return { orders: res.data.map(mapPrismaOrderToOrderItem), pieData: buildPieData(res.data) };
    },
  });

  const orders = ordersQuery.data?.orders ?? [];
  const setOrders = (updater: (prev: OrderItem[]) => OrderItem[]) =>
    queryClient.setQueryData<{ orders: OrderItem[]; pieData: PieDataItem[] }>(DASHBOARD_ORDERS_KEY, (prev) =>
      prev ? { ...prev, orders: updater(prev.orders) } : prev
    );

  // 3. Cập nhật trạng thái đơn hàng (Optimistic UI, rollback khi lỗi)
  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    const dbOrderId = targetOrder?.rawId || orderId;
    const dbStatus = mapUiStatusToDbStatus(nextStatus);

    const prevOrders = [...orders];
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order)));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }

    setIsUpdatingStatus(true);
    try {
      const res = await updateOrderStatusAction(dbOrderId, dbStatus);
      if (!res.success) {
        setOrders(() => prevOrders);
        notify.error(res.error, "ORDER_STATUS_UPDATE_FAILED");
        return;
      }

      notifySuccess(t("orders.updateSuccess", { id: orderId }));
      // Tải lại thống kê để cập nhật số đơn chờ xử lý
      void queryClient.invalidateQueries({ queryKey: ["admin", "dashboard", "stats"] });
    } catch (err) {
      setOrders(() => prevOrders);
      notify.error(err, "ORDER_STATUS_UPDATE_FAILED");
    } finally {
      setIsUpdatingStatus(false);
    }
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
    stats: statsQuery.data ?? defaultStats,
    pieData: ordersQuery.data?.pieData ?? defaultPieData,
    isLoadingStats: statsQuery.isFetching,
    isLoadingOrders: ordersQuery.isFetching,
    isUpdatingStatus,
    handleUpdateStatus,
    getStatusColor,
    refreshOrders: () => void ordersQuery.refetch(),
    refreshStats: () => void statsQuery.refetch(),
  };
}
