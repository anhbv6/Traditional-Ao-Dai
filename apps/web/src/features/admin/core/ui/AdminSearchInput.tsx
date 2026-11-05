"use client";

import { useRef } from "react";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { AdminTooltip } from "./AdminTooltip";

interface AdminSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  className?: string;
}

/**
 * Ô tìm kiếm admin: kính lúp đầu ô, nút ✕ xóa nhanh (icon lucide, đen, có hover) ở cuối.
 * Ẩn nút ✕ mặc định của trình duyệt cho `type="search"` (Chrome vẽ dấu ✕ xanh không theo màu dự án).
 */
export function AdminSearchInput({ value, onChange, placeholder, autoFocus, className }: AdminSearchInputProps) {
  const t = useTranslations("Common.textField");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={cn("relative min-w-0", className)}>
      <Search
        size={15}
        className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-[#A1A1AA]"
        aria-hidden
      />
      <input
        ref={inputRef}
        autoFocus={autoFocus}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
        placeholder={placeholder}
        className="h-9 w-full rounded-xl border border-[#E4E4E7] bg-white pl-8 pr-9 text-sm text-[#09090B] outline-none transition-colors placeholder:text-[#A1A1AA] hover:not-focus:border-[#D4D4D8] focus:border-[#18181B] [&::-webkit-search-cancel-button]:appearance-none"
      />
      {value && (
        <AdminTooltip content={t("clear")}>
          <button
            type="button"
            aria-label={t("clear")}
            onClick={() => {
              onChange("");
              // Xóa xong giữ focus trong ô để gõ tiếp
              inputRef.current?.focus();
            }}
            className="absolute right-1.5 top-1/2 grid size-6 -translate-y-1/2 cursor-pointer place-items-center rounded-md text-[#09090B] outline-none transition-colors hover:bg-[#F4F4F5] focus-visible:bg-[#F4F4F5] focus-visible:ring-2 focus-visible:ring-[#18181B]/15"
          >
            <X size={14} strokeWidth={2} aria-hidden />
          </button>
        </AdminTooltip>
      )}
    </div>
  );
}
