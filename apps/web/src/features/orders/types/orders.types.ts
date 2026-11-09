import { type BespokeConfig } from "@repo/shared/bespoke";
import { type OrderMeasurements, type PaymentMethod, type ShippingDetail } from "@repo/shared/orders";

export type {
  CustomerOrderFilter,
  CustomerOrderStage,
  CustomerOrderSummaryDto,
  FittingAppointmentDto,
  OrderAmountsDto,
  OrderLookupDto,
  OrderMeasurements,
  OrderTimelineDto,
  OrderTrackedItemDto,
  PaymentInstructionDto,
  PaymentMethod,
  ShippingDetail,
  TrackingEventDto,
  TrackingProgress,
} from "@repo/shared/orders";

/** Một dòng gửi lên API khi đặt hàng (giá do server tính) */
export interface PlaceOrderLine {
  productSlug: string;
  size?: string;
  color?: string;
  quantity: number;
  measurements?: OrderMeasurements;
  bespoke?: BespokeConfig;
}

export interface PlaceOrderPayload {
  customer: { fullName: string; phone: string; email: string };
  shipping: ShippingDetail;
  note?: string;
  items: PlaceOrderLine[];
  paymentMethod: PaymentMethod;
  depositPercent?: number;
  locale: "vi" | "en";
}

export interface MyOrdersMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  counts: Partial<Record<string, number>>;
}
