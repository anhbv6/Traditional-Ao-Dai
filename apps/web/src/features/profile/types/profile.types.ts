import { type Gender } from "@repo/shared";
import { type OrderMeasurementKey } from "@repo/shared/orders";
import { type AuthUser } from "@/features/auth";

/** PUT /api/user/profile — email & SĐT đổi qua luồng xác minh mã, không gửi ở đây */
export type ProfilePayload = {
  name?: string;
  avatarUrl?: string | null;
  /** YYYY-MM-DD */
  birthDate?: string | null;
  gender?: Gender | null;
};

export type UpdateProfileResponse = {
  status: string;
  statusCode: number;
  message: string;
  data: AuthUser;
};

export interface Address {
  id: string;
  receiverName: string;
  receiverPhone: string;
  addressLine: string;
  provinceCode?: string | null;
  provinceName?: string | null;
  districtCode?: string | null;
  districtName?: string | null;
  wardCode?: string | null;
  wardName?: string | null;
  postalCode?: string | null;
  label?: string | null;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type AddressPayload = {
  receiverName: string;
  receiverPhone: string;
  addressLine: string;
  provinceCode?: string | null;
  provinceName: string;
  districtCode?: string | null;
  districtName: string;
  wardCode?: string | null;
  wardName: string;
  postalCode?: string | null;
  label?: string | null;
  isDefault?: boolean;
};

export interface PaymentCard {
  id: string;
  holder: string;
  number: string;
  expiry: string;
  type: "visa" | "mastercard";
  isDefault: boolean;
}

/**
 * Một bộ số đo đã lưu (khớp bảng `UserMeasurement`): khách có thể lưu nhiều bộ (của mình, của mẹ…), đúng một bộ mặc định.
 * Giá trị đo theo `ORDER_MEASUREMENT_KEYS` (cm, riêng cân nặng kg).
 */
export interface MeasurementProfile {
  id: string;
  profileName: string;
  isDefault: boolean;
  values: Partial<Record<OrderMeasurementKey, number>>;
  note?: string;
}

export type MeasurementProfileInput = Omit<MeasurementProfile, "id">;
