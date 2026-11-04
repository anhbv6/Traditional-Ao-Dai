"use client";

import { useState } from "react";
import { FolderPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotify } from "@/hooks/useNotify";
import { useRouter } from "@/i18n/routing";
import {
  ADMIN_DIALOG_PRIMARY_BUTTON_CLASS,
  ADMIN_DIALOG_SECONDARY_BUTTON_CLASS,
  AdminDialog,
  AdminInfoTip,
} from "@/features/admin/core/ui";
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
    <AdminDialog
      open={open}
      onOpenChange={onOpenChange}
      icon={FolderPlus}
      title={t("create.title")}
      description={t("create.description")}
      onSubmit={handleSubmit}
      footer={
        <>
          <button type="button" onClick={() => onOpenChange(false)} className={ADMIN_DIALOG_SECONDARY_BUTTON_CLASS}>
            {t("cancel")}
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim() || !codeValid}
            className={ADMIN_DIALOG_PRIMARY_BUTTON_CLASS}
          >
            {isSubmitting ? t("processing") : t("create.submit")}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-[#3F3F46]">{t("field.name")} *</span>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("field.placeholders.vi.name")}
            className={INPUT_CLASS}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="flex items-center gap-1.5 text-sm font-medium text-[#3F3F46]">
            {t("field.code")} *
            <AdminInfoTip content={t("create.codeHint")} />
          </span>
          <input
            value={effectiveCode}
            onChange={(e) => {
              setCodeTouched(true);
              setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""));
            }}
            maxLength={12}
            placeholder={t("field.codePlaceholder")}
            aria-invalid={Boolean(effectiveCode) && !codeValid}
            className={`${INPUT_CLASS} font-mono uppercase tracking-wider placeholder:font-sans placeholder:normal-case placeholder:tracking-normal aria-invalid:border-rose-500`}
          />
        </label>
      </div>
    </AdminDialog>
  );
}
