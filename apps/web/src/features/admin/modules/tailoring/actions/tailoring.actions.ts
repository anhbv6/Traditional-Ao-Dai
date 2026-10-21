"use server";

import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { revalidatePath } from "next/cache";
import { type z } from "zod";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { updateTailoringStatusSchema } from "../schemas/tailoring.schemas";

/**
 * Server Action: Cập nhật công đoạn may đo và ghi nhật ký TailoringLog
 */
export async function updateTailoringStatusAction(raw: z.input<typeof updateTailoringStatusSchema>) {
  const auth = await authorizeAdminAction({ permission: "canUpdateTailoring" });
  if (!auth.success) return auth;

  const parsed = parseActionInput(updateTailoringStatusSchema, raw);
  if (!parsed.success) return parsed;
  const params = parsed.data;

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
          staffId: auth.user.id,
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
  } catch (error) {
    console.error("Lỗi updateTailoringStatusAction:", error);
    return {
      success: false,
      error: "TAILORING_UPDATE_FAILED",
    };
  }
}
