import * as z from "zod";
import { MEASUREMENT_FIELDS, type MeasurementId } from "../data/bespokeOptions";

/** Ghi chú cho thợ may (ký tự) — đồng bộ maxLength của ô nhập */
export const BESPOKE_NOTES_MAX_LENGTH = 400;

/** Một số đo (cm): bắt buộc, là số, nằm trong khoảng hợp lệ của từng số đo. Mã lỗi dịch qua `Errors`. */
const measurement = (min: number, max: number) =>
  z
    .string()
    .trim()
    .min(1, "MEASUREMENT_REQUIRED")
    .refine((value) => {
      const number = Number(value.replace(",", "."));
      return Number.isFinite(number) && number >= min && number <= max;
    }, "MEASUREMENT_OUT_OF_RANGE");

const measurementShape = Object.fromEntries(MEASUREMENT_FIELDS.map((field) => [field.id, measurement(field.min, field.max)])) as Record<
  MeasurementId,
  ReturnType<typeof measurement>
>;

/** Số đo riêng — chỉ kiểm tra khi khách chọn "Tự nhập số đo" */
export const measurementsSchema = z.object(measurementShape);
export type MeasurementsInput = z.input<typeof measurementsSchema>;
