import { type MoveStageResult, type TailoringOrder } from "../types/tailoring.types";

/** Áp kết quả chuyển công đoạn vào danh sách đơn tại chỗ (trước khi server trả dữ liệu mới) */
export function applyMove<T extends TailoringOrder>(orders: T[], result: MoveStageResult): T[] {
  return orders.map((order) => ({
    ...order,
    orderStatus: order.items.some((item) => item.id === result.itemId) && order.orderStatus === "CONFIRMED" && result.stage !== "WAITING_FABRIC"
      ? "IN_PRODUCTION"
      : order.orderStatus,
    items: order.items.map((item) =>
      item.id === result.itemId
        ? {
            ...item,
            status: result.stage,
            stageSince: result.createdAt,
            lastLog: {
              id: result.logId,
              orderItemId: item.id,
              status: result.stage,
              note: result.note,
              images: [],
              staffName: result.staffName,
              createdAt: result.createdAt,
            },
          }
        : item
    ),
  }));
}
