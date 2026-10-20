"use client";

import { useTranslations } from "next-intl";
import { showToast } from "@/components/ui/toast";
import { useWishlistStore } from "../store/wishlistStore";
import { type NewWishlistItem } from "../types/wishlist.types";

/**
 * Thao tác danh sách yêu thích có "Hoàn tác" (thông báo toast):
 * - `toggleWithUndo`: bấm tim — thêm thì im lặng (tim đã đổi trạng thái), BỎ thì hiện thông báo kèm hoàn tác.
 * - `clearWithUndo`: xóa toàn bộ — hoàn tác trả lại cả danh sách (giữ nguyên thời điểm thêm cũ).
 */
export function useWishlistUndo() {
  const t = useTranslations("WishlistPage");

  const toggleWithUndo = (item: NewWishlistItem) => {
    const { items, toggle } = useWishlistStore.getState();
    const existing = items.find((entry) => entry.slug === item.slug);
    const added = toggle(item);
    if (added || !existing) return added;

    showToast.undo({
      title: t("undo.removed", { name: existing.name }),
      actionLabel: t("actions.undo"),
      onUndo: () => useWishlistStore.getState().restore(existing),
    });
    return added;
  };

  const clearWithUndo = () => {
    const { items, clear } = useWishlistStore.getState();
    if (items.length === 0) return;
    clear();

    showToast.undo({
      title: t("undo.cleared", { count: items.length }),
      actionLabel: t("actions.undo"),
      onUndo: () => items.forEach((item) => useWishlistStore.getState().restore(item)),
    });
  };

  return { toggleWithUndo, clearWithUndo };
}
