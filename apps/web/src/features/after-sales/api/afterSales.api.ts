import type { AfterSalesRequestPayload, AfterSalesRequestResult } from "../types/afterSales.types";

/**
 * Gửi yêu cầu sửa đồ / đổi trả — hiện là MOCK (Backend chưa có module `returns`).
 * Khi có API: `apiClient.post("/api/after-sales", payload)` (multipart cho ảnh) và xoá phần giả lập dưới đây.
 */
export const submitAfterSalesRequestApi = async (payload: AfterSalesRequestPayload): Promise<AfterSalesRequestResult> => {
  void payload;
  await new Promise((resolve) => setTimeout(resolve, 900));
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase();
  return { requestCode: `RQ-${suffix}` };
};
