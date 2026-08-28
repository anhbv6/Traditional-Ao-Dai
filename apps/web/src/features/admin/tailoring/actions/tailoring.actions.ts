"use server";

import { prisma } from "../../server/db.server";
import { type TailoringStatus } from "../types/tailoring.types";
import { revalidatePath } from "next/cache";

/**
 * Server Action: Cập nhật công đoạn may đo và ghi nhật ký TailoringLog
 */
export async function updateTailoringStatusAction(params: {
  orderItemId: string;
  orderId: string;
  status: TailoringStatus;
  staffId: string;
  note?: string;
}) {
  try {
    const [updatedItem, log] = await prisma.$transaction([
      prisma.orderItem.update({
        where: { id: params.orderItemId },
        data: { tailoringStatus: params.status },
      }),
      prisma.tailoringLog.create({
        data: {
          orderId: params.orderId,
          orderItemId: params.orderItemId,
          status: params.status,
          staffId: params.staffId,
          note: params.note,
        },
      }),
    ]);

    revalidatePath("/admin/tailoring");
    revalidatePath("/admin/orders");
    revalidatePath("/admin/dashboard");

    return {
      success: true,
      data: { updatedItem, log },
    };
  } catch (error: any) {
    console.error("Lỗi updateTailoringStatusAction:", error);
    return {
      success: false,
      error: error?.message || "Không thể cập nhật tiến độ may đo.",
    };
  }
}
