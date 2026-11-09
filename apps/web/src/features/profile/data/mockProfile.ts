import { type PaymentCard } from "../types/profile.types";

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
