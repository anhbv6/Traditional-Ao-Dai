"use server";

import { revalidatePath } from "next/cache";
import { type z } from "zod";
import { Prisma } from "@repo/db";
import { prisma } from "../../../core/server/db.server";
import { authorizeAdminAction } from "../../../core/server/adminAuth.server";
import { recordAudit } from "../../../core/server/audit.server";
import { ADMIN_MODULE_ACCESS } from "../../../core/session/permissions";
import { parseActionInput } from "@/features/admin/core/server/actionInput";
import { toAdminVoucher, voucherSelect } from "../queries/vouchers.queries";
import {
  createVoucherSchema,
  toggleVoucherActiveSchema,
  updateVoucherSchema,
  voucherIdSchema,
} from "../schemas/vouchers.schemas";
import { dayToIso, suggestVoucherCode } from "../utils/voucherRules";

type FormOutput = z.output<typeof createVoucherSchema>;

/** Form → dữ liệu Prisma: mức tối đa chỉ có nghĩa với giảm theo %, ngày theo giờ tiệm */
function toData(values: FormOutput) {
  return {
    code: values.code,
    description: values.description || null,
    discountType: values.discountType,
    value: values.value,
    minOrderValue: values.minOrderValue || null,
    maxDiscount: values.discountType === "PERCENTAGE" ? values.maxDiscount : null,
    usageLimit: values.usageLimit,
    startDate: new Date(dayToIso(values.startDay, "start")),
    endDate: new Date(dayToIso(values.endDay, "end")),
    isActive: values.isActive,
  };
}

const isUniqueViolation = (error: unknown) => error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";

function revalidateVouchers(voucherId?: string) {
  revalidatePath("/admin/vouchers");
  if (voucherId) revalidatePath(`/admin/vouchers/${voucherId}`);
}

/** Tạo coupon mới */
export async function createVoucherAction(raw: z.input<typeof createVoucherSchema>) {
  const auth = await authorizeAdminAction(ADMIN_MODULE_ACCESS.vouchers);
  if (!auth.success) return auth;
  const input = parseActionInput(createVoucherSchema, raw);
  if (!input.success) return input;

  try {
    const created = await prisma.voucher.create({ data: toData(input.data), select: voucherSelect });
    await recordAudit({ actorId: auth.user.id, action: "VOUCHER_CREATED", targetType: "VOUCHER", targetId: created.id, metadata: { code: created.code } });
    revalidateVouchers();
    return { success: true as const, data: toAdminVoucher(created) };
  } catch (error) {
    if (isUniqueViolation(error)) return { success: false as const, error: "VOUCHER_CODE_TAKEN" };
    console.error("Lỗi createVoucherAction:", error);
    return { success: false as const, error: "VOUCHER_CREATE_FAILED" };
  }
}

/** Sửa coupon — mã đã có đơn dùng thì không đổi mã (đơn cũ tra theo mã) */
export async function updateVoucherAction(raw: z.input<typeof updateVoucherSchema>) {
  const auth = await authorizeAdminAction(ADMIN_MODULE_ACCESS.vouchers);
  if (!auth.success) return auth;
  const input = parseActionInput(updateVoucherSchema, raw);
  if (!input.success) return input;
  const { voucherId, values } = input.data;

  try {
    const current = await prisma.voucher.findUnique({ where: { id: voucherId }, select: { code: true, _count: { select: { orders: true } } } });
    if (!current) return { success: false as const, error: "VOUCHER_NOT_FOUND" };
    if (current._count.orders > 0 && current.code !== values.code) return { success: false as const, error: "VOUCHER_IN_USE" };

    const updated = await prisma.voucher.update({ where: { id: voucherId }, data: toData(values), select: voucherSelect });
    await recordAudit({ actorId: auth.user.id, action: "VOUCHER_UPDATED", targetType: "VOUCHER", targetId: voucherId, metadata: { code: updated.code } });
    revalidateVouchers(voucherId);
    return { success: true as const, data: toAdminVoucher(updated) };
  } catch (error) {
    if (isUniqueViolation(error)) return { success: false as const, error: "VOUCHER_CODE_TAKEN" };
    console.error("Lỗi updateVoucherAction:", error);
    return { success: false as const, error: "VOUCHER_UPDATE_FAILED" };
  }
}

/** Bật / tắt coupon */
export async function toggleVoucherActiveAction(raw: z.input<typeof toggleVoucherActiveSchema>) {
  const auth = await authorizeAdminAction(ADMIN_MODULE_ACCESS.vouchers);
  if (!auth.success) return auth;
  const input = parseActionInput(toggleVoucherActiveSchema, raw);
  if (!input.success) return input;
  const { voucherId, isActive } = input.data;

  try {
    const updated = await prisma.voucher.update({ where: { id: voucherId }, data: { isActive }, select: voucherSelect });
    await recordAudit({
      actorId: auth.user.id,
      action: isActive ? "VOUCHER_ENABLED" : "VOUCHER_DISABLED",
      targetType: "VOUCHER",
      targetId: voucherId,
    });
    revalidateVouchers(voucherId);
    return { success: true as const, data: toAdminVoucher(updated) };
  } catch (error) {
    console.error("Lỗi toggleVoucherActiveAction:", error);
    return { success: false as const, error: "VOUCHER_UPDATE_FAILED" };
  }
}

/** Nhân bản: cùng điều kiện, mã mới, lượt dùng về 0, tắt sẵn để soát lại trước khi chạy */
export async function duplicateVoucherAction(raw: z.input<typeof voucherIdSchema>) {
  const auth = await authorizeAdminAction(ADMIN_MODULE_ACCESS.vouchers);
  if (!auth.success) return auth;
  const input = parseActionInput(voucherIdSchema, raw);
  if (!input.success) return input;

  try {
    const source = await prisma.voucher.findUnique({ where: { id: input.data.voucherId } });
    if (!source) return { success: false as const, error: "VOUCHER_NOT_FOUND" };
    // Thử vài mã ngẫu nhiên phòng trùng
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const created = await prisma.voucher.create({
          data: {
            code: suggestVoucherCode(),
            description: source.description,
            discountType: source.discountType,
            value: source.value,
            minOrderValue: source.minOrderValue,
            maxDiscount: source.maxDiscount,
            usageLimit: source.usageLimit,
            startDate: source.startDate,
            endDate: source.endDate,
            isActive: false,
          },
          select: voucherSelect,
        });
        await recordAudit({ actorId: auth.user.id, action: "VOUCHER_CREATED", targetType: "VOUCHER", targetId: created.id, metadata: { duplicatedFrom: source.code } });
        revalidateVouchers();
        return { success: true as const, data: toAdminVoucher(created) };
      } catch (error) {
        if (!isUniqueViolation(error)) throw error;
      }
    }
    return { success: false as const, error: "VOUCHER_CREATE_FAILED" };
  } catch (error) {
    console.error("Lỗi duplicateVoucherAction:", error);
    return { success: false as const, error: "VOUCHER_CREATE_FAILED" };
  }
}

/** Xóa coupon chưa từng gắn vào đơn nào; đã dùng thì chỉ tắt được */
export async function deleteVoucherAction(raw: z.input<typeof voucherIdSchema>) {
  const auth = await authorizeAdminAction(ADMIN_MODULE_ACCESS.vouchers);
  if (!auth.success) return auth;
  const input = parseActionInput(voucherIdSchema, raw);
  if (!input.success) return input;
  const { voucherId } = input.data;

  try {
    const voucher = await prisma.voucher.findUnique({ where: { id: voucherId }, select: { code: true, _count: { select: { orders: true } } } });
    if (!voucher) return { success: false as const, error: "VOUCHER_NOT_FOUND" };
    if (voucher._count.orders > 0) return { success: false as const, error: "VOUCHER_IN_USE" };
    await prisma.voucher.delete({ where: { id: voucherId } });
    await recordAudit({ actorId: auth.user.id, action: "VOUCHER_DELETED", targetType: "VOUCHER", targetId: voucherId, metadata: { code: voucher.code } });
    revalidateVouchers();
    return { success: true as const, data: { id: voucherId } };
  } catch (error) {
    console.error("Lỗi deleteVoucherAction:", error);
    return { success: false as const, error: "VOUCHER_DELETE_FAILED" };
  }
}
