"use client";

import { useState } from "react";
import { type PaymentCard } from "../types/profile.types";
import { initialCards } from "../data/mockProfile";

/**
 * Thẻ đã lưu (dữ liệu mẫu — chưa có API thanh toán).
 * Không có form nhập số thẻ / CVV ở đây: thẻ mới chỉ được lưu qua cổng thanh toán (token hoá) lúc thanh toán.
 */
export function useManagePayment() {
  const [cards, setCards] = useState<PaymentCard[]>(initialCards);

  const handleDelete = (id: string) => {
    setCards((prev) => {
      const remaining = prev.filter((card) => card.id !== id);
      // Gỡ thẻ mặc định → thẻ đầu tiên còn lại thành mặc định
      if (remaining.length > 0 && !remaining.some((card) => card.isDefault)) {
        return remaining.map((card, index) => ({ ...card, isDefault: index === 0 }));
      }
      return remaining;
    });
  };

  const handleSetDefault = (id: string) => {
    setCards((prev) => prev.map((card) => ({ ...card, isDefault: card.id === id })));
  };

  return { cards, handleDelete, handleSetDefault };
}
