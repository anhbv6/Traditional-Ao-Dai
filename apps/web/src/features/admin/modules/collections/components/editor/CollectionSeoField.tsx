"use client";

import { useWatch, type UseFormReturn } from "react-hook-form";
import { Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { AdminInfoTip, type AdminContentLang } from "@/features/admin/core/ui";
import { type SaveCollectionValues } from "../../schemas/collections.schemas";

const INPUT_CLASS =
  "w-full rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm text-[#09090B] outline-none placeholder:text-[#A1A1AA] focus:border-[#18181B] disabled:bg-[#F4F4F5] disabled:text-[#71717A]";

// Độ dài Google thường hiển thị trọn — vượt vẫn lưu được nhưng sẽ bị cắt trên kết quả tìm kiếm
const TITLE_SOFT_LIMIT = 60;
const DESCRIPTION_SOFT_LIMIT = 160;

function Counter({ length, limit }: { length: number; limit: number }) {
  return (
    <span className={cn("tabular-nums", length > limit ? "text-amber-700" : "text-[#A1A1AA]")}>
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
  const titleKey = lang === "vi" ? "seoTitle" : "seoTitleEn";
  const descriptionKey = lang === "vi" ? "seoDescription" : "seoDescriptionEn";

  const values = useWatch({ control: form.control });
  const title = values[titleKey] || (lang === "vi" ? values.name : values.nameEn || values.name) || "";
  const description =
    values[descriptionKey] ||
    (lang === "vi" ? values.tagline || values.description : values.taglineEn || values.descriptionEn) ||
    "";

  return (
    <div className="space-y-4">
      <label className="block space-y-1.5">
        <span className="flex items-center gap-1.5 text-sm font-medium text-[#3F3F46]">
          {t("slug")} {slugLocked && <Lock size={12} className="text-[#A1A1AA]" aria-label={t("locked")} />}
          {slugLocked && <AdminInfoTip content={t("lockedHint")} />}
        </span>
        <div className="flex items-center rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] focus-within:border-[#18181B]">
          <span className="shrink-0 pl-3 text-sm text-[#A1A1AA]">/{lang}/bo-suu-tap/</span>
          <input
            {...form.register("slug")}
            disabled={slugLocked}
            className="h-9 min-w-0 flex-1 rounded-r-lg bg-transparent pr-3 text-sm text-[#09090B] outline-none disabled:text-[#71717A]"
          />
        </div>
      </label>

      <label className="block space-y-1.5">
        <span className="flex justify-between text-sm font-medium text-[#3F3F46]">
          {t("title")} <Counter length={values[titleKey]?.length ?? 0} limit={TITLE_SOFT_LIMIT} />
        </span>
        <input
          key={titleKey}
          {...form.register(titleKey)}
          placeholder={t("titlePlaceholder")}
          className={cn(INPUT_CLASS, "h-9")}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="flex justify-between text-sm font-medium text-[#3F3F46]">
          {t("description")} <Counter length={values[descriptionKey]?.length ?? 0} limit={DESCRIPTION_SOFT_LIMIT} />
        </span>
        <textarea
          key={descriptionKey}
          {...form.register(descriptionKey)}
          rows={3}
          placeholder={t("descriptionPlaceholder")}
          className={cn(INPUT_CLASS, "py-2")}
        />
      </label>

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
