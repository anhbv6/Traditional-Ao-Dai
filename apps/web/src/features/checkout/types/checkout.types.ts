export interface CartItem {
  id: number;
  name: string;
  slug: string;
  image: string;
  quantity: number;
  price: number;
  size: string;
}

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
