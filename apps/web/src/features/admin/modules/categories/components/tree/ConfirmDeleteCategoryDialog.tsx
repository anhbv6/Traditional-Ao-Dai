"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useNotify } from "@/hooks/useNotify";
import { deleteCategoryAction } from "../../actions/categories.actions";
import { type AdminCategoryNode } from "../../types/categories.types";

/** Xác nhận xóa loại sản phẩm trống (menu chỉ bật mục xóa khi không còn sản phẩm/loại con, server cũng chặn) */
export function ConfirmDeleteCategoryDialog({
  category,
  onOpenChange,
  onDeleted,
}: {
  category: AdminCategoryNode;
  onOpenChange: (open: boolean) => void;
  onDeleted: (tree: AdminCategoryNode[]) => void;
}) {
  const t = useTranslations("AdminPage.categories");
  const notify = useNotify();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteCategoryAction(category.id);
      if (!res.success) {
        notify.error(res.error, "CATEGORY_DELETE_FAILED");
        return;
      }
      notify.success(t("deleteDialog.success"));
      onDeleted(res.data.tree);
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="admin-shell gap-0 rounded-xl border border-[#E4E4E7] bg-white p-0 sm:max-w-md">
        <div className="px-5 py-4 pr-12">
          <DialogTitle className="text-base font-semibold text-[#09090B]">{t("deleteDialog.title")}</DialogTitle>
          <DialogDescription className="mt-1.5 text-sm text-[#3F3F46]">
            {t("deleteDialog.description", { name: category.name })}
          </DialogDescription>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#E4E4E7] px-5 py-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-9 cursor-pointer rounded-lg px-3.5 text-sm font-medium text-[#52525B] transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B]"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="h-9 cursor-pointer rounded-lg bg-rose-600 px-4 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:opacity-50"
          >
            {isDeleting ? t("processing") : t("deleteDialog.confirm")}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
