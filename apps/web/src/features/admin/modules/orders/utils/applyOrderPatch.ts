import { type AdminOrderRow, type OrderPatch } from "../types/orders.types";

/** Áp một thay đổi vào đơn nếu đúng id (giữ nguyên kiểu chi tiết / dòng) */
export function applyOrderPatch<T extends AdminOrderRow>(order: T, patch: OrderPatch): T {
  if (order.id !== patch.orderId) return order;
  const { orderId: _orderId, ...changes } = patch;
  return { ...order, ...changes };
}
