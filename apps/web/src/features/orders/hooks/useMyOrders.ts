"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { type CustomerOrderFilter } from "@repo/shared/orders";
import { useAuthStore } from "@/features/auth";
import { listMyOrdersApi } from "../api/orders.api";
import { MY_ORDERS_PAGE_SIZE, ORDER_QUERY_KEYS } from "../constants/orderQueryKeys";

/** Danh sách "Đơn hàng của tôi" — lọc theo nhóm trạng thái ở server, phân trang */
export function useMyOrders() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [filter, setFilterState] = useState<CustomerOrderFilter>("ALL");
  const [page, setPage] = useState(1);

  const query = useQuery({
    queryKey: ORDER_QUERY_KEYS.mine(filter, page),
    queryFn: () => listMyOrdersApi({ status: filter, page, limit: MY_ORDERS_PAGE_SIZE }),
    enabled: isAuthenticated,
    placeholderData: keepPreviousData,
  });

  /** Đổi bộ lọc → về trang 1 (điều chỉnh trong event handler, không dùng effect) */
  const setFilter = (next: CustomerOrderFilter) => {
    setFilterState(next);
    setPage(1);
  };

  return {
    filter,
    setFilter,
    page,
    setPage,
    orders: query.data?.items ?? [],
    meta: query.data?.meta,
    isLoading: !isAuthenticated || query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
