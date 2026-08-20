export interface CartItem {
  id: number;
  name: string;
  slug: string;
  image: string;
  quantity: number;
  price: number;
  size: string;
}

export interface ActiveDiscount {
  code: string;
  type: "percentage" | "freeship";
  value: number;
}
