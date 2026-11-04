"use client";

import { cn } from "@/lib/utils";
import { AdminInfoTip } from "./AdminInfoTip";

/** Ngôn ngữ nội dung soạn ở admin — cột gốc tiếng Việt, cột `<field>En` cho tiếng Anh (AGENTS.md §9) */
export const ADMIN_CONTENT_LANGS = ["vi", "en"] as const;
export type AdminContentLang = (typeof ADMIN_CONTENT_LANGS)[number];

// Tên ngôn ngữ viết bằng chính ngôn ngữ đó (endonym) — không dịch theo giao diện
const LANG_NAMES: Record<AdminContentLang, string> = { vi: "Tiếng Việt", en: "English" };

interface AdminLangSwitchProps {
  value: AdminContentLang;
  onChange: (lang: AdminContentLang) => void;
  /** Nhãn đọc màn hình cho nhóm tab, ví dụ "Ngôn ngữ nội dung" */
  label: string;
  /** Phạm vi áp dụng (các trường đổi theo ngôn ngữ) — hiện trong ⓘ cạnh công tắc */
  hint?: string;
  /** Chấm báo trên từng ngôn ngữ: `missing` (cam) = chưa dịch, `error` (đỏ) = có lỗi cần sửa */
  status?: Partial<Record<AdminContentLang, "missing" | "error" | undefined>>;
  /** Nhãn đọc màn hình cho chấm `missing` */
  missingLabel?: string;
  className?: string;
}

/**
 * Công tắc ngôn ngữ nội dung dạng segmented nhỏ VI / EN — đặt cạnh tiêu đề nơi nó áp dụng:
 * thanh đầu màn chi tiết (đổi mọi thẻ), đầu thẻ (đổi riêng thẻ đó) hoặc `headerAside` của AdminDialog.
 */
export function AdminLangSwitch({
  value,
  onChange,
  label,
  hint,
  status,
  missingLabel,
  className,
}: AdminLangSwitchProps) {
  return (
    <div className={cn("inline-flex shrink-0 items-center gap-1.5", className)}>
      <div role="tablist" aria-label={label} className="inline-flex rounded-lg bg-[#F4F4F5] p-1">
        {ADMIN_CONTENT_LANGS.map((lang) => {
          const mark = status?.[lang];
          const active = value === lang;
          return (
            <button
              key={lang}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={LANG_NAMES[lang]}
              title={LANG_NAMES[lang]}
              onClick={() => onChange(lang)}
              className={cn(
                "flex h-7 min-w-11 cursor-pointer items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#18181B]/15",
                active
                  ? "bg-white text-[#09090B] shadow-2xs ring-1 ring-[#E4E4E7]"
                  : "text-[#71717A] hover:text-[#09090B]"
              )}
            >
              {lang.toUpperCase()}
              {mark && (
                <span
                  role={mark === "missing" && missingLabel ? "img" : undefined}
                  aria-label={mark === "missing" ? missingLabel : undefined}
                  aria-hidden={mark === "missing" && missingLabel ? undefined : true}
                  className={cn("size-1.5 rounded-full", mark === "error" ? "bg-rose-500" : "bg-amber-500")}
                />
              )}
            </button>
          );
        })}
      </div>
      {hint && <AdminInfoTip content={hint} />}
    </div>
  );
}
