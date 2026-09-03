"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { notifySuccess, notifyError } from "@/lib/messages";
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

export function useAdminDashboard() {
  const t = useTranslations("AdminPage");
  const [filter, setFilter] = useState<FilterType>("week");
  const [stats, setStats] = useState<StatItem>(defaultStats);
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [pieData, setPieData] = useState<PieDataItem[]>(defaultPieData);

  const [isLoadingStats, setIsLoadingStats] = useState<boolean>(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState<boolean>(true);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);

  // 1. Tải số liệu thống kê Dashboard trực tiếp từ DB qua Prisma Server Action
  const fetchStats = useCallback(async (currentFilter: FilterType) => {
    setIsLoadingStats(true);
    try {
      const res = await getDashboardStatsAction(currentFilter);
      if (res.success && res.data) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Lỗi tải thống kê dashboard:", err);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // 2. Tải danh sách đơn hàng quản trị trực tiếp từ DB qua Prisma Server Action
  const fetchOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    try {
      const res = await getAdminOrdersAction();
      if (res.success && Array.isArray(res.data)) {
        const mappedOrders = res.data.map(mapPrismaOrderToOrderItem);
        setOrders(mappedOrders);

        // Tính toán phân bổ sản phẩm thực tế cho biểu đồ nếu có đơn
        const productCounts: Record<string, number> = {};
        let totalCount = 0;
        res.data.forEach((o: any) => {
          (o.items || []).forEach((item: any) => {
            const pName = item.productName || item.product?.name || "Áo Dài";
            productCounts[pName] = (productCounts[pName] || 0) + (item.quantity || 1);
            totalCount += item.quantity || 1;
          });
        });

        if (totalCount > 0) {
          const colors = ["#09090B", "#27272A", "#71717A", "#E4E4E7", "#A1A1AA"];
          const computedPie: PieDataItem[] = Object.entries(productCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([name, count], idx) => ({
              name,
              value: Math.round((count / totalCount) * 100),
              color: colors[idx % colors.length] || "#09090B",
            }));
          if (computedPie.length > 0) {
            setPieData(computedPie);
          }
        }
      }
    } catch (err) {
      console.error("Lỗi tải danh sách đơn hàng:", err);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(filter);
  }, [filter, fetchStats]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 3. Cập nhật trạng thái đơn hàng trực tiếp xuống DB qua Prisma Server Action
  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    const targetOrder = orders.find((o) => o.id === orderId);
    const dbOrderId = targetOrder?.rawId || orderId;
    const dbStatus = mapUiStatusToDbStatus(nextStatus);

    // Cập nhật giao diện ngay lập tức (Optimistic UI)
    const prevOrders = [...orders];
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, status: nextStatus } : order))
    );
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder((prev) => (prev ? { ...prev, status: nextStatus } : null));
    }

    setIsUpdatingStatus(true);
    try {
      const res = await updateOrderStatusAction(dbOrderId, dbStatus);
      if (!res.success) {
        // Rollback nếu thất bại
        setOrders(prevOrders);
        notifyError(res.error || t("orders.updateError"));
        return;
      }

      notifySuccess(t("orders.updateSuccess", { id: orderId }));
      // Tải lại thống kê để cập nhật số đơn chờ xử lý
      fetchStats(filter);
    } catch (err) {
      setOrders(prevOrders);
      notifyError(err, t("orders.updateError"));
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
    stats,
    pieData,
    isLoadingStats,
    isLoadingOrders,
    isUpdatingStatus,
    handleUpdateStatus,
    getStatusColor,
    refreshOrders: fetchOrders,
    refreshStats: () => fetchStats(filter),
  };
}
