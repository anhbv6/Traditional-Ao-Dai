import { type OrderStatus } from "@repo/shared/orders";
import { AFTER_SALES_SERVICES, type AfterSalesService } from "../constants/afterSalesOptions";

/** Áo may đo theo số đo riêng không đổi / trả — chỉ chỉnh sửa và bảo hành lỗi kỹ thuật */
const CUSTOM_FIT_SERVICES: readonly AfterSalesService[] = ["ALTERATION", "WARRANTY"];

/** Loại yêu cầu áp dụng được cho một món trong đơn */
export function allowedServicesFor(item: { isCustomFit: boolean }): readonly AfterSalesService[] {
  return item.isCustomFit ? CUSTOM_FIT_SERVICES : AFTER_SALES_SERVICES;
}

/** Chỉ đơn đã giao xong mới gửi yêu cầu sửa / đổi / trả */
export function isOrderEligible(status: OrderStatus): boolean {
  return status === "DELIVERED";
}
