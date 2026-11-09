"use client";

import { useQuery } from "@tanstack/react-query";
import { getMyOrderApi, trackOrderApi } from "../api/orders.api";
import { ORDER_QUERY_KEYS } from "../constants/orderQueryKeys";

/** Timeline đơn qua magic link (token READ) */
export function useOrderTimeline(token: string) {
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.track(token),
    queryFn: () => trackOrderApi(token),
    enabled: token.length > 0,
    retry: false,
  });
}

/** Timeline đơn của khách đã đăng nhập */
export function useMyOrder(orderCode: string, enabled: boolean) {
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.myOrder(orderCode),
    queryFn: () => getMyOrderApi(orderCode),
    enabled: enabled && orderCode.length > 0,
    retry: false,
  });
}
