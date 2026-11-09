/** Khóa React Query của đơn hàng (dạng mảng) */
export const ORDER_QUERY_KEYS = {
  all: ["orders"] as const,
  track: (token: string) => ["orders", "track", token] as const,
  mine: (status: string, page: number) => ["orders", "me", status, page] as const,
  myOrder: (orderCode: string) => ["orders", "me", "detail", orderCode] as const,
};

/** Số đơn mỗi trang ở màn "Đơn hàng của tôi" */
export const MY_ORDERS_PAGE_SIZE = 8;
