import { z } from "zod";
import { VOUCHER_CODE_REGEX } from "../utils/voucherRules";

const day = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "VOUCHER_INVALID_DATES");
const money = z.number().int().min(0).max(1_000_000_000);

/** Form soạn coupon — luật chéo trường (ngày, % / tiền, mức tối đa) kiểm tra trong `superRefine` */
export const voucherFormSchema = z
  .object({
    code: z
      .string()
      .trim()
      .transform((value) => value.toUpperCase())
      .pipe(z.string().regex(VOUCHER_CODE_REGEX, "VOUCHER_CODE_INVALID")),
    description: z.string().trim().max(200),
    discountType: z.enum(["PERCENTAGE", "FIXED_AMOUNT"]),
    value: z.number().positive("VOUCHER_INVALID_VALUE"),
    minOrderValue: money.nullable(),
    maxDiscount: money.positive("VOUCHER_INVALID_VALUE").nullable(),
    usageLimit: z.number().int().positive("VOUCHER_INVALID_LIMIT").max(1_000_000).nullable(),
    startDay: day,
    endDay: day,
    isActive: z.boolean(),
  })
  .superRefine((input, ctx) => {
    if (input.endDay < input.startDay) ctx.addIssue({ code: "custom", path: ["endDay"], message: "VOUCHER_INVALID_DATES" });
    if (input.discountType === "PERCENTAGE" && input.value > 100) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "VOUCHER_INVALID_VALUE" });
    }
    if (input.discountType === "FIXED_AMOUNT" && (!Number.isInteger(input.value) || input.value > 1_000_000_000)) {
      ctx.addIssue({ code: "custom", path: ["value"], message: "VOUCHER_INVALID_VALUE" });
    }
  });

export const createVoucherSchema = voucherFormSchema;
export const updateVoucherSchema = z.object({ voucherId: z.uuid(), values: voucherFormSchema });
export const voucherIdSchema = z.object({ voucherId: z.uuid() });
export const toggleVoucherActiveSchema = z.object({ voucherId: z.uuid(), isActive: z.boolean() });
