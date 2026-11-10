export type DiscountType = "PERCENTAGE" | "FIXED_AMOUNT";

/** Coupon đã chuẩn hóa để truyền qua Server Component (tiền là số nguyên VND, ngày dạng ISO) */
export interface AdminVoucher {
  id: string;
  code: string;
  description: string | null;
  discountType: DiscountType;
  /** % giảm hoặc số tiền giảm cố định */
  value: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  /** Số đơn đã gắn mã — > 0 thì khóa đổi mã / xóa */
  ordersCount: number;
  createdAt: string;
}

export interface AdminVouchersData {
  vouchers: AdminVoucher[];
  now: string;
}

/** Dữ liệu form soạn coupon (ngày dạng YYYY-MM-DD theo giờ tiệm) */
export interface VoucherFormValues {
  code: string;
  description: string;
  discountType: DiscountType;
  value: number;
  minOrderValue: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  startDay: string;
  endDay: string;
  isActive: boolean;
}

export interface VoucherEditorData {
  voucher: AdminVoucher | null;
  now: string;
}
