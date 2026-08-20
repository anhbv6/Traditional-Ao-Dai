import { type WishlistItem } from "../types/wishlist.types";

export const initialWishlistItems: WishlistItem[] = [
  {
    id: "prod-1",
    name: { vi: "Áo Dài Gấm Song Hỷ", en: "Song Hy Brocade Ao Dai" },
    price: "1.890.000 ₫",
    image: "https://cdn.pixabay.com/photo/2021/04/16/07/22/ao-dai-6182834_640.jpg",
    stockStatus: "in_stock",
    category: { vi: "Áo Dài Gấm Cao Cấp", en: "Premium Brocade" },
  },
  {
    id: "prod-2",
    name: { vi: "Áo Dài Tơ Tằm Cổ Điển", en: "Classic Mulberry Silk Ao Dai" },
    price: "2.450.000 ₫",
    image: "https://cdn.pixabay.com/photo/2022/07/15/03/42/vietnamese-woman-7322247_640.jpg",
    stockStatus: "custom",
    category: { vi: "Áo Dài Lụa Tơ Tằm", en: "Mulberry Silk" },
  },
  {
    id: "prod-3",
    name: { vi: "Áo Dài Nhung Đỏ Quý Phái", en: "Noble Red Velvet Ao Dai" },
    price: "3.200.000 ₫",
    image: "https://cdn.pixabay.com/photo/2015/08/13/18/43/vietnam-887413_640.jpg",
    stockStatus: "in_stock",
    category: { vi: "Áo Dài Nhung Hoàng Gia", en: "Imperial Velvet" },
  },
  {
    id: "prod-4",
    name: { vi: "Áo Dài Cách Tân Hoa Đào", en: "Modern Peach Blossom Ao Dai" },
    price: "1.290.000 ₫",
    image: "https://cdn.pixabay.com/photo/2020/02/05/08/18/girl-4820464_640.jpg",
    stockStatus: "out_of_stock",
    category: { vi: "Áo Dài Cách Tân", en: "Modern Reform" },
  },
];
