import { toVnd } from "@repo/shared";
import { type Prisma } from "@repo/db";
import { prisma } from "../../../core/server/db.server";
import { type AdminVoucher, type AdminVouchersData, type VoucherEditorData } from "../types/vouchers.types";

const voucherSelect = {
  id: true,
  code: true,
  description: true,
  discountType: true,
  value: true,
  minOrderValue: true,
  maxDiscount: true,
  usageLimit: true,
  usedCount: true,
  startDate: true,
  endDate: true,
  isActive: true,
  createdAt: true,
  _count: { select: { orders: true } },
} satisfies Prisma.VoucherSelect;

export function toAdminVoucher(voucher: Prisma.VoucherGetPayload<{ select: typeof voucherSelect }>): AdminVoucher {
  return {
    id: voucher.id,
    code: voucher.code,
    description: voucher.description,
    discountType: voucher.discountType,
    // % giữ số lẻ (VD 7.5%), tiền quy về số nguyên VND
    value: voucher.discountType === "PERCENTAGE" ? Number(voucher.value) : toVnd(voucher.value),
    minOrderValue: voucher.minOrderValue === null ? null : toVnd(voucher.minOrderValue),
    maxDiscount: voucher.maxDiscount === null ? null : toVnd(voucher.maxDiscount),
    usageLimit: voucher.usageLimit,
    usedCount: voucher.usedCount,
    startDate: voucher.startDate.toISOString(),
    endDate: voucher.endDate.toISOString(),
    isActive: voucher.isActive,
    ordersCount: voucher._count.orders,
    createdAt: voucher.createdAt.toISOString(),
  };
}

export { voucherSelect };

/** Toàn bộ coupon, mới tạo trước */
export async function getAdminVouchersQuery(): Promise<AdminVouchersData> {
  const vouchers = await prisma.voucher.findMany({ select: voucherSelect, orderBy: { createdAt: "desc" } });
  return { vouchers: vouchers.map(toAdminVoucher), now: new Date().toISOString() };
}

/** Coupon để soạn (null = tạo mới; id không tồn tại → null để page trả 404) */
export async function getVoucherEditorQuery(voucherId: string | null): Promise<VoucherEditorData | null> {
  const now = new Date().toISOString();
  if (!voucherId) return { voucher: null, now };
  const voucher = await prisma.voucher.findUnique({ where: { id: voucherId }, select: voucherSelect });
  return voucher ? { voucher: toAdminVoucher(voucher), now } : null;
}
