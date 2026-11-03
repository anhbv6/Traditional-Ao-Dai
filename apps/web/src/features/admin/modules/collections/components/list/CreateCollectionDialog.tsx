"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useNotify } from "@/hooks/useNotify";
import { useRouter } from "@/i18n/routing";
import { toSlug } from "@/features/admin/modules/products";
import { createCollectionAction } from "../../actions/collections.actions";
import { COLLECTION_CODE_PATTERN } from "../../utils/collectionLifecycle";

const INPUT_CLASS =
  "h-10 w-full rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm text-[#09090B] outline-none placeholder:text-[#A1A1AA] focus:border-[#18181B]";

/** Gợi ý mã: chữ đầu mỗi từ + 2 số cuối của năm có trong tên, VD "Tết Bính Ngọ 2026" → TBN26 */
function suggestCode(name: string): string {
  const words = toSlug(name).split("-").filter(Boolean);
  const year = words.find((word) => /^\d{4}$/.test(word))?.slice(2) ?? "";
  const initials = words
    .filter((word) => !/^\d+$/.test(word))
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase();
  return `${initials.slice(0, 12 - year.length)}${year}`;
}

/** Tạo nhanh bộ sưu tập nháp rồi chuyển sang trình soạn để điền chi tiết */
export function CreateCollectionDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("AdminPage.collections");
  const notify = useNotify();
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [codeTouched, setCodeTouched] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const effectiveCode = codeTouched ? code : suggestCode(name);
  const codeValid = COLLECTION_CODE_PATTERN.test(effectiveCode);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await createCollectionAction({ name, code: effectiveCode });
      if (!res.success) {
        notify.error(res.error, "COLLECTION_CREATE_FAILED");
        return;
      }
      notify.success(t("create.success"));
      router.push(`/admin/catalog/collections/${res.data.id}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="admin-shell gap-0 rounded-xl border border-[#E4E4E7] bg-white p-0 sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="border-b border-[#E4E4E7] px-5 py-4 pr-12">
            <DialogTitle className="text-base font-semibold text-[#09090B]">{t("create.title")}</DialogTitle>
            <DialogDescription className="mt-0.5 text-xs text-[#71717A]">{t("create.description")}</DialogDescription>
          </div>

          <div className="space-y-4 px-5 py-5">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#3F3F46]">{t("field.name")} *</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("create.namePlaceholder")}
                className={INPUT_CLASS}
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#3F3F46]">{t("field.code")} *</span>
              <input
                value={effectiveCode}
                onChange={(e) => {
                  setCodeTouched(true);
                  setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
                }}
                maxLength={12}
                placeholder="TET26"
                aria-invalid={Boolean(effectiveCode) && !codeValid}
                className={`${INPUT_CLASS} font-mono uppercase tracking-wider aria-invalid:border-rose-500`}
              />
              <span className="block text-xs text-[#71717A]">{t("create.codeHint")}</span>
            </label>
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
              type="submit"
              disabled={isSubmitting || !name.trim() || !codeValid}
              className="h-9 cursor-pointer rounded-lg bg-[#18181B] px-4 text-sm font-medium text-white shadow-2xs transition-colors hover:bg-[#09090B] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? t("processing") : t("create.submit")}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
