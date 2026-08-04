import { type Address, type PaymentCard, type Order } from "../types/profile.types";

export const initialAddresses: Address[] = [
  {
    id: "addr-1",
    name: "Nguyễn Thị An",
    phone: "0912345678",
    province: "Hà Nội",
    district: "Ba Đình",
    ward: "Trúc Bạch",
    detail: "Số 15, Ngách 12/4, Ngõ Trúc Lạc",
    isDefault: true,
  },
  {
    id: "addr-2",
    name: "Trần Văn Bình",
    phone: "0987654321",
    province: "Hồ Chí Minh",
    district: "Quận 1",
    ward: "Bến Nghé",
    detail: "Đường Đồng Khởi, Tòa nhà Metropolitan, Lầu 8",
    isDefault: false,
  },
];

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
    total: "1.590.000 ₫",
    items: [
      {
        name: { vi: "Áo Dài Phượng Hoàng", en: "Phoenix Ao Dai" },
        price: "1.590.000 ₫",
        quantity: 1,
        image: "https://cdn.pixabay.com/photo/2021/11/14/06/17/ao-dai-6792949_640.jpg",
      },
    ],
  },
  {
    id: "AD-99890",
    date: "2026-08-01",
    status: "processing",
    total: "2.100.000 ₫",
    items: [
      {
        name: { vi: "Áo Dài Thêu Hoa Sen", en: "Lotus Embroidered Ao Dai" },
        price: "2.100.000 ₫",
        quantity: 1,
        image: "https://cdn.pixabay.com/photo/2016/11/19/11/33/girl-1838779_640.jpg",
      },
    ],
  },
  {
    id: "AD-99823",
    date: "2026-07-28",
    status: "delivered",
    total: "3.780.000 ₫",
    items: [
      {
        name: { vi: "Áo Dài Gấm Song Hỷ", en: "Song Hy Brocade Ao Dai" },
        price: "1.890.000 ₫",
        quantity: 2,
        image: "https://cdn.pixabay.com/photo/2021/04/16/07/22/ao-dai-6182834_640.jpg",
      },
    ],
  },
  {
    id: "AD-99120",
    date: "2026-07-15",
    status: "shipped",
    total: "2.450.000 ₫",
    items: [
      {
        name: { vi: "Áo Dài Tơ Tằm Cổ Điển", en: "Classic Mulberry Silk Ao Dai" },
        price: "2.450.000 ₫",
        quantity: 1,
        image: "https://cdn.pixabay.com/photo/2022/07/15/03/42/vietnamese-woman-7322247_640.jpg",
      },
    ],
  },
  {
    id: "AD-98002",
    date: "2026-06-30",
    status: "cancelled",
    total: "1.290.000 ₫",
    items: [
      {
        name: { vi: "Áo Dài Cách Tân Hoa Đào", en: "Modern Peach Blossom Ao Dai" },
        price: "1.290.000 ₫",
        quantity: 1,
        image: "https://cdn.pixabay.com/photo/2020/02/05/08/18/girl-4820464_640.jpg",
      },
    ],
  },
];
