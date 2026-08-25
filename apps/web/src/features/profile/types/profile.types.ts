import { type AuthUser } from "@/features/auth/types/auth.types";

export type ProfilePayload = {
  name?: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  dob?: string | null;
  gender?: string;
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

export interface OrderItem {
  name: { vi: string; en: string };
  price: string;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  date: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  total: string;
  items: OrderItem[];
}

export type TabId = "personal" | "orders" | "address" | "payment" | "security" | "setting";
