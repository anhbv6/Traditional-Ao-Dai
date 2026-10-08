import { type Prisma } from "@repo/db";
import { prisma } from "../../server/db.server";
import { type TailoringItemData, type TailoringStatus } from "../types/tailoring.types";

/**
 * Query: Lấy danh sách toàn bộ các sản phẩm Áo Dài đang được đặt may theo số đo riêng
 */
export async function getTailoringItemsQuery(status?: TailoringStatus | "ALL"): Promise<TailoringItemData[]> {
  try {
    const whereCondition: Prisma.OrderItemWhereInput = {
      isCustomFit: true,
    };

    if (status && status !== "ALL") {
      whereCondition.tailoringStatus = status;
    }

    const items = await prisma.orderItem.findMany({
      where: whereCondition,
      include: {
        order: {
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerPhone: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            images: true,
          },
        },
        tailoringLogs: {
          include: {
            staff: {
              select: { id: true, name: true },
            },
          },
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return items.map((i) => ({
      id: i.id,
      orderId: i.order.id,
      orderNumber: i.order.orderNumber,
      customerName: i.order.customerName,
      customerPhone: i.order.customerPhone,
      productName: i.productName,
      productImage: i.product?.images?.[0] || null,
      tailoringStatus: i.tailoringStatus as TailoringStatus,
      height: i.height,
      weight: i.weight,
      bust: i.bust,
      waist: i.waist,
      hips: i.hips,
      shoulder: i.shoulder,
      armLength: i.armLength,
      armpit: i.armpit,
      neck: i.neck,
      shirtLength: i.shirtLength,
      pantsLength: i.pantsLength,
      thigh: i.thigh,
      customNote: i.customNote,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
      latestLog: i.tailoringLogs[0]
        ? {
            status: i.tailoringLogs[0].status as TailoringStatus,
            note: i.tailoringLogs[0].note,
            staffName: i.tailoringLogs[0].staff?.name || null,
            createdAt: i.tailoringLogs[0].createdAt,
          }
        : null,
    }));
  } catch (error) {
    console.error("Lỗi khi query danh sách xưởng may đo:", error);
    return [];
  }
}
