import { type AfterSalesService, type HandoverMethod } from "../constants/afterSalesOptions";

export type { AfterSalesService, HandoverMethod } from "../constants/afterSalesOptions";

/** Dữ liệu gửi lên khi tạo yêu cầu hậu mãi */
export interface AfterSalesRequestPayload {
  orderCode: string;
  contact: string;
  productName: string;
  service: AfterSalesService;
  reason: string;
  description: string;
  handover: HandoverMethod;
  photoCount: number;
}

export interface AfterSalesRequestResult {
  requestCode: string;
}
