export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

export interface AdminVoucherItem {
  id: string;
  code: string;
  description?: string | null;
  discountType: DiscountType;
  value: number;
  minOrderValue?: number | null;
  maxDiscount?: number | null;
  usageLimit?: number | null;
  usedCount: number;
  startDate: Date | string;
  endDate: Date | string;
  isActive: boolean;
  ordersCount: number;
  createdAt: Date | string;
}
