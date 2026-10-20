"use client";

import { useTranslations } from "next-intl";
import { showToast } from "@/components/ui/toast";
import { useCartStore } from "../store/cartStore";

/**
 * Xóa khỏi giỏ có "Hoàn tác" (thông báo toast) — dùng chung cho trang giỏ hàng và giỏ mini ở header.
 * Hoàn tác khôi phục đúng vị trí dòng cũ và cả mã giảm giá nếu nó bị gỡ vì giỏ trống.
 */
export function useCartUndo() {
  const t = useTranslations("CartPage");

  const removeWithUndo = (id: string) => {
    const { items, discount, removeItem } = useCartStore.getState();
    const index = items.findIndex((item) => item.id === id);
    if (index === -1) return;
    const removed = items[index];
    removeItem(id);

    showToast.undo({
      title: t("undo.removed", { name: removed.name }),
      actionLabel: t("actions.undo"),
      onUndo: () => {
        const store = useCartStore.getState();
        store.restoreItem(removed, index);
        if (discount && !store.discount) store.applyDiscount(discount);
      },
    });
  };

  const clearWithUndo = () => {
    const { items, discount, clear } = useCartStore.getState();
    if (items.length === 0) return;
    clear();

    showToast.undo({
      title: t("undo.cleared", { count: items.length }),
      actionLabel: t("actions.undo"),
      onUndo: () => useCartStore.getState().restoreSnapshot(items, discount),
    });
  };

  return { removeWithUndo, clearWithUndo };
}
