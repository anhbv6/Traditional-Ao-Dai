// Checkout dùng chung kiểu dòng giỏ hàng với feature cart
export type { CartItem } from "@/features/cart";

export interface ShippingData {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  province: string;
  district: string;
  ward: string;
  notes: string;
}

export interface PaymentData {
  method: "cod" | "bank" | "card";
  cardHolder: string;
  cardNumber: string;
  cardExpiry: string;
  cardCvv: string;
}
