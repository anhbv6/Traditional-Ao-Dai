"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { AdminTextArea, AdminTextField, type AdminContentLang } from "@/features/admin/core/ui";
import { useNotify } from "@/hooks/useNotify";
import { COLLECTION_TEXT_LIMITS, type SaveCollectionValues } from "../../schemas/collections.schemas";

// Độ dài Google thường hiển thị trọn — vượt vẫn lưu được nhưng sẽ bị cắt trên kết quả tìm kiếm
const TITLE_SOFT_LIMIT = 60;
const DESCRIPTION_SOFT_LIMIT = 160;

function Counter({ length, limit }: { length: number; limit: number }) {
  return (
    <span className={cn("ml-auto font-normal tabular-nums", length > limit ? "text-amber-700" : "text-[#A1A1AA]")}>
      {length}/{limit}
    </span>
  );
}

/**
 * SEO hai ngôn ngữ kèm xem trước kết quả Google; slug khóa lại sau khi công bố.
 * Ngôn ngữ do nơi chứa quyết định (AdminLangSwitch cạnh tiêu đề dialog SEO).
 */
export function CollectionSeoField({
  form,
  slugLocked,
  lang,
}: {
  form: UseFormReturn<SaveCollectionValues>;
  slugLocked: boolean;
  lang: AdminContentLang;
}) {
  const t = useTranslations("AdminPage.collections.seo");
  const notify = useNotify();
  const titleKey = lang === "vi" ? "seoTitle" : "seoTitleEn";
  const descriptionKey = lang === "vi" ? "seoDescription" : "seoDescriptionEn";
  const { errors } = form.formState;
  const err = (key?: string) => (key ? notify.translateError(key) : undefined);

  const values = useWatch({ control: form.control });
  const title = values[titleKey] || (lang === "vi" ? values.name : values.nameEn || values.name) || "";
  const description =
    values[descriptionKey] ||
    (lang === "vi" ? values.tagline || values.description : values.taglineEn || values.descriptionEn) ||
    "";

  return (
    <div className="space-y-4">
      <AdminTextField
        {...form.register("slug")}
        disabled={slugLocked}
        label={t("slug")}
        hint={slugLocked ? t("lockedHint") : undefined}
        prefix={<span className="text-sm">/{lang}/bo-suu-tap/</span>}
        suffix={slugLocked ? <Lock size={13} className="text-[#A1A1AA]" aria-label={t("locked")} /> : undefined}
        inputClassName="pl-0"
        fieldClassName="gap-0"
      />

      <AdminTextField
        key={titleKey}
        {...form.register(titleKey)}
        label={
          <>
            {t("title")} <Counter length={values[titleKey]?.length ?? 0} limit={TITLE_SOFT_LIMIT} />
          </>
        }
        placeholder={t("titlePlaceholder")}
        maxLength={COLLECTION_TEXT_LIMITS.seoTitle}
        error={err(errors[titleKey]?.message)}
      />
      <AdminTextArea
        key={descriptionKey}
        {...form.register(descriptionKey)}
        label={
          <>
            {t("description")} <Counter length={values[descriptionKey]?.length ?? 0} limit={DESCRIPTION_SOFT_LIMIT} />
          </>
        }
        rows={3}
        placeholder={t("descriptionPlaceholder")}
        maxLength={COLLECTION_TEXT_LIMITS.seoDescription}
        error={err(errors[descriptionKey]?.message)}
      />

      <div className="rounded-lg border border-[#E4E4E7] bg-white p-4">
        <p className="mb-2 text-xs font-medium text-[#71717A]">{t("googlePreview")}</p>
        <p className="truncate text-xs text-[#3F3F46]">
          tiemthiencanh.vn › {lang} › bo-suu-tap › {values.slug}
        </p>
        <p className="mt-0.5 line-clamp-1 text-lg leading-snug text-[#1a0dab]">{title || t("untitled")} | Thiên Canh</p>
        <p className="mt-0.5 line-clamp-2 text-sm text-[#4d5156]">{description || t("noDescription")}</p>
      </div>
    </div>
  );
}
