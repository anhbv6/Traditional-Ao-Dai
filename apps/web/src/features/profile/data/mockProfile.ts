import { type PaymentCard, type Order } from "../types/profile.types";

/**
 * Dữ liệu mock cho trang hồ sơ (thẻ thanh toán, lịch sử đơn hàng) — thay bằng API khi có module orders/payments
 */
export const initialCards: PaymentCard[] = [
  {
    id: "card-1",
    holder: "NGUYEN THI AN",
    number: "•••• •••• •••• 4532",
    expiry: "12/28",
    type: "visa",
    isDefault: true,
  },
  {
    id: "card-2",
    holder: "NGUYEN THI AN",
    number: "•••• •••• •••• 8890",
    expiry: "08/30",
    type: "mastercard",
    isDefault: false,
  },
];

export const mockOrders: Order[] = [
  {
    id: "AD-99905",
    date: "2026-08-03",
    status: "pending",
    total: 1_590_000,
    items: [
      {
        name: { vi: "Áo Dài Phượng Hoàng", en: "Phoenix Ao Dai" },
        price: 1_590_000,
        quantity: 1,
        image: "/images/ex10.jpg",
      },
    ],
  },
  {
    id: "AD-99890",
    date: "2026-08-01",
    status: "processing",
    total: 2_100_000,
    items: [
      {
        name: { vi: "Áo Dài Thêu Hoa Sen", en: "Lotus Embroidered Ao Dai" },
        price: 2_100_000,
        quantity: 1,
        image: "/images/ex1.jpg",
      },
    ],
  },
  {
    id: "AD-99823",
    date: "2026-07-28",
    status: "delivered",
    total: 3_780_000,
    items: [
      {
        name: { vi: "Áo Dài Gấm Song Hỷ", en: "Song Hy Brocade Ao Dai" },
        price: 1_890_000,
        quantity: 2,
        image: "/images/ex2.jpg",
      },
    ],
  },
  {
    id: "AD-99120",
    date: "2026-07-15",
    status: "shipped",
    total: 2_450_000,
    items: [
      {
        name: { vi: "Áo Dài Tơ Tằm Cổ Điển", en: "Classic Mulberry Silk Ao Dai" },
        price: 2_450_000,
        quantity: 1,
        image: "/images/ex3.jpg",
      },
    ],
  },
  {
    id: "AD-98002",
    date: "2026-06-30",
    status: "cancelled",
    total: 1_290_000,
    items: [
      {
        name: { vi: "Áo Dài Cách Tân Hoa Đào", en: "Modern Peach Blossom Ao Dai" },
        price: 1_290_000,
        quantity: 1,
        image: "/images/ex4.jpg",
      },
    ],
  },
];
