export interface Address {
  id: string;
  name: string;
  phone: string;
  province: string;
  district: string;
  ward: string;
  detail: string;
  isDefault: boolean;
}

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
