import { prisma } from "../../server/db.server";
import { type AdminCustomerItem } from "../types/customers.types";

/**
 * Query: Lấy danh sách khách hàng kèm số đơn, tổng chi tiêu & hồ sơ số đo may Áo Dài
 */
export async function getAdminCustomersQuery(search?: string): Promise<AdminCustomerItem[]> {
  try {
    const whereCondition: any = {
      role: "CUSTOMER",
    };

    if (search) {
      whereCondition.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search } },
      ];
    }

    const customers = await prisma.user.findMany({
      where: whereCondition,
      include: {
        orders: {
          select: { totalAmount: true, paymentStatus: true },
        },
        measurements: {
          select: {
            id: true,
            profileName: true,
            isDefault: true,
            height: true,
            weight: true,
            bust: true,
            waist: true,
            hips: true,
            shoulder: true,
            armLength: true,
            neck: true,
            shirtLength: true,
            pantsLength: true,
            note: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return customers.map((c) => {
      const paidOrders = c.orders.filter((o) => o.paymentStatus === "PAID" || o.paymentStatus === "PARTIALLY_PAID");
      const totalSpent = paidOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        avatar: c.avatar,
        isActive: c.isActive,
        ordersCount: c.orders.length,
        totalSpent,
        measurements: c.measurements,
        createdAt: c.createdAt,
      };
    });
  } catch (error) {
    console.error("Lỗi khi query danh sách khách hàng:", error);
    return [];
  }
}
