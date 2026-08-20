export interface WishlistItem {
  id: string;
  name: { vi: string; en: string };
  price: string;
  image: string;
  stockStatus: "in_stock" | "custom" | "out_of_stock";
  category: { vi: string; en: string };
}
