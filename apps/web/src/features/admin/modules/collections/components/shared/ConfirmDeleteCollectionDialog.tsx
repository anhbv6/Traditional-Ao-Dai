"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useNotify } from "@/hooks/useNotify";
import { deleteCollectionAction } from "../../actions/collections.actions";

/** Xác nhận xóa bộ sưu tập chưa công bố (đã công bố thì menu không hiện mục xóa, server cũng chặn) */
export function ConfirmDeleteCollectionDialog({
  collection,
  onOpenChange,
  onDeleted,
}: {
  collection: { id: string; name: string } | null;
  onOpenChange: (open: boolean) => void;
  onDeleted: (id: string) => void;
}) {
  const t = useTranslations("AdminPage.collections");
  const notify = useNotify();
  const [isDeleting, setIsDeleting] = useState(false);

  if (!collection) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const res = await deleteCollectionAction(collection.id);
      if (!res.success) {
        notify.error(res.error, "COLLECTION_DELETE_FAILED");
        return;
      }
      notify.success(t("deleteDialog.success"));
      onDeleted(collection.id);
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
            {t("deleteDialog.description", { name: collection.name })}
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
