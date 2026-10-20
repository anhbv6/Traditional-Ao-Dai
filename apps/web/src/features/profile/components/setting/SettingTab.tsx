"use client";

import { useTranslations } from "next-intl";
import { Palette } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { ProfileSection } from "../ProfileSection";

/**
 * Cài đặt hiển thị trên thiết bị: giao diện sáng / tối.
 * Ngôn ngữ đã có ở header + menu mobile → không lặp lại ở đây.
 */
export function SettingTab() {
  const t = useTranslations("ProfilePage.setting");

  return (
    <ProfileSection flush>
      <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-4">
          <span className="relative grid size-10 shrink-0 place-items-center text-[var(--primary-ink)]">
            <span aria-hidden="true" className="absolute inset-1.5 rotate-45 border border-[var(--primary-color)]/35" />
            <Palette size={16} strokeWidth={1.5} className="relative" aria-hidden="true" />
          </span>
          <div>
            <p className="text-[15px] font-semibold text-[var(--text-main)]">{t("appearance.title")}</p>
            <p className="mt-0.5 text-[13px] text-[var(--text-light)]">{t("appearance.description")}</p>
          </div>
        </div>
        <AnimatedThemeToggler
          variant="circle"
          aria-label={t("appearance.title")}
          className="ml-14 grid size-10 shrink-0 cursor-pointer place-items-center border border-[var(--border)] text-[var(--primary-ink)] transition-colors outline-none hover:border-[var(--primary-color)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] sm:ml-0 [&_svg]:size-4"
        />
      </div>
    </ProfileSection>
  );
}
