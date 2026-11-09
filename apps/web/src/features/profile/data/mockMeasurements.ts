import { type MeasurementProfile } from "../types/profile.types";

/**
 * Số đo mẫu — MOCK TẠM: Backend chưa có endpoint số đo.
 * Khi có `/api/user/measurements` (bảng `UserMeasurement`), thay store bằng React Query và xóa file này.
 */
export const mockMeasurements: MeasurementProfile[] = [
  {
    id: "measure-me",
    profileName: "Số đo của tôi",
    isDefault: true,
    values: { height: 160, weight: 48, bust: 82, waist: 64, hips: 88, shoulder: 36, armLength: 56, shirtLength: 130 },
    note: "Vai hơi xuôi, thích tà dài chấm gót.",
  },
  {
    id: "measure-mom",
    profileName: "Số đo của mẹ",
    isDefault: false,
    values: { height: 155, weight: 54, bust: 88, waist: 72, hips: 94 },
  },
];
