import { type Prisma } from "@repo/db";
import { prisma } from "../../server/db.server";
import { type AdminVoucherItem } from "../types/vouchers.types";

/**
 * Query: Lấy danh sách toàn bộ mã giảm giá Voucher
 */
export async function getAdminVouchersQuery(search?: string): Promise<AdminVoucherItem[]> {
  try {
    const whereCondition: Prisma.VoucherWhereInput = {};
    if (search) {
      whereCondition.OR = [
        { code: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    const vouchers = await prisma.voucher.findMany({
      where: whereCondition,
      include: {
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return vouchers.map((v) => ({
      id: v.id,
      code: v.code,
      description: v.description,
      discountType: v.discountType,
      value: Number(v.value),
      minOrderValue: v.minOrderValue ? Number(v.minOrderValue) : null,
      maxDiscount: v.maxDiscount ? Number(v.maxDiscount) : null,
      usageLimit: v.usageLimit,
      usedCount: v.usedCount,
      startDate: v.startDate,
      endDate: v.endDate,
      isActive: v.isActive,
      ordersCount: v._count.orders,
      createdAt: v.createdAt,
    }));
  } catch (error) {
    console.error("Lỗi khi query vouchers:", error);
    return [];
  }
}
