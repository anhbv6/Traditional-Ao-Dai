import { type OrderMeasurementKey } from "@repo/shared/orders";

/**
 * Khoảng hợp lý cho từng số đo (chặn gõ nhầm 1600 thay vì 160) + gợi ý trong ô nhập.
 * Đơn vị cm, riêng cân nặng kg. Khi có API số đo, server kiểm tra lại bằng cùng ngưỡng.
 */
export const MEASUREMENT_RANGES: Record<OrderMeasurementKey, { min: number; max: number; unit: "cm" | "kg"; placeholder: number }> = {
  height: { min: 90, max: 220, unit: "cm", placeholder: 160 },
  weight: { min: 15, max: 200, unit: "kg", placeholder: 50 },
  bust: { min: 40, max: 180, unit: "cm", placeholder: 84 },
  waist: { min: 35, max: 180, unit: "cm", placeholder: 66 },
  hips: { min: 40, max: 200, unit: "cm", placeholder: 90 },
  shoulder: { min: 20, max: 70, unit: "cm", placeholder: 36 },
  armLength: { min: 20, max: 90, unit: "cm", placeholder: 56 },
  armpit: { min: 20, max: 80, unit: "cm", placeholder: 34 },
  neck: { min: 20, max: 60, unit: "cm", placeholder: 32 },
  shirtLength: { min: 50, max: 180, unit: "cm", placeholder: 130 },
  pantsLength: { min: 40, max: 140, unit: "cm", placeholder: 100 },
  thigh: { min: 25, max: 100, unit: "cm", placeholder: 52 },
};

/** Số đo chính hiện trên thẻ tóm tắt (đủ để nhận ra bộ số đo) */
export const MEASUREMENT_SUMMARY_KEYS: readonly OrderMeasurementKey[] = ["height", "weight", "bust", "waist", "hips"];

export const PROFILE_NAME_MAX = 60;
export const MEASUREMENT_NOTE_MAX = 300;
