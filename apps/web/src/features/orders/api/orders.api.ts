import { apiClient } from "@/lib/api-client";
import {
  type CustomerOrderFilter,
  type CustomerOrderSummaryDto,
  type OrderLookupDto,
  type OrderMeasurements,
  type OrderTimelineDto,
  type PlaceOrderResultDto,
  type ShippingDetail,
} from "@repo/shared/orders";
import { type PlaceOrderPayload, type MyOrdersMeta } from "../types/orders.types";

interface ApiData<T> {
  data: T;
  message?: string;
}

/** Đặt hàng — khách vãng lai không có token vẫn đặt được (API dùng optionalAuth) */
export const placeOrderApi = async (payload: PlaceOrderPayload): Promise<PlaceOrderResultDto> =>
  (await apiClient.post<ApiData<PlaceOrderResultDto>>("/api/orders", payload)).data;

/** Cơ chế A: mã đơn + SĐT/email */
export const lookupOrderApi = async (payload: { orderCode: string; contact: string }): Promise<OrderLookupDto> =>
  (await apiClient.post<ApiData<OrderLookupDto>>("/api/orders/lookup", payload, { skipAuth: true })).data;

/** Cơ chế B: timeline qua magic link (token gửi trong body, không nằm trong log URL của API) */
export const trackOrderApi = async (token: string): Promise<OrderTimelineDto> =>
  (await apiClient.post<ApiData<OrderTimelineDto>>("/api/orders/track", { token }, { skipAuth: true })).data;

export const sendOrderOtpApi = async (payload: { token: string; purpose: "EDIT" | "CLAIM" }) =>
  (await apiClient.post<ApiData<{ ttl: number; maskedPhone: string; devCode?: string }>>("/api/orders/track/otp", payload, { skipAuth: true })).data;

export const verifyOrderEditApi = async (payload: { token: string; code: string }) =>
  (await apiClient.post<ApiData<{ editToken: string; ttl: number }>>("/api/orders/track/verify", payload, { skipAuth: true })).data;

export const updateOrderAddressApi = async (payload: { token: string; editToken: string; shipping: ShippingDetail }) =>
  (await apiClient.patch<ApiData<OrderTimelineDto>>("/api/orders/track/address", payload, { skipAuth: true })).data;

export const updateOrderMeasurementsApi = async (payload: {
  token: string;
  editToken: string;
  itemId: string;
  measurements: OrderMeasurements;
  customNote?: string;
}) => (await apiClient.patch<ApiData<OrderTimelineDto>>("/api/orders/track/measurements", payload, { skipAuth: true })).data;

export const listMyOrdersApi = async (params: { status: CustomerOrderFilter; page: number; limit: number }) => {
  const res = await apiClient.get<{ data: CustomerOrderSummaryDto[]; meta: MyOrdersMeta }>("/api/orders/me", { params });
  return { items: res.data, meta: res.meta };
};

export const getMyOrderApi = async (orderCode: string): Promise<OrderTimelineDto> =>
  (await apiClient.get<ApiData<OrderTimelineDto>>(`/api/orders/me/${encodeURIComponent(orderCode)}`)).data;

export const createMyOrderLinkApi = async (orderCode: string): Promise<{ accessToken: string }> =>
  (await apiClient.post<ApiData<{ accessToken: string }>>(`/api/orders/me/${encodeURIComponent(orderCode)}/link`, {})).data;

/** Tạo tài khoản từ đơn khách vãng lai (OTP SĐT của đơn + mật khẩu hoặc Google) */
export const registerFromOrderApi = async (
  payload:
    | { method: "password"; token: string; code: string; password: string }
    | { method: "google"; token: string; code: string; credential: string }
) => (await apiClient.post<ApiData<{ accessToken: string }>>("/api/auth/register/from-order", payload, { skipAuth: true })).data;
