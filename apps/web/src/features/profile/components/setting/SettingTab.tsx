"use client";

import React, { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Languages, Palette, type LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "@/i18n/routing";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { ChoiceGroup } from "@/components/shared/ChoiceGroup";
import { ProfileSection } from "../ProfileSection";

type AppLocale = "vi" | "en";

function SettingRow({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description: string; children: React.ReactNode }) {
  return (
    <li className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex items-start gap-4">
        <span className="relative grid size-10 shrink-0 place-items-center text-[var(--primary-ink)]">
          <span aria-hidden="true" className="absolute inset-1.5 rotate-45 border border-[var(--primary-color)]/35" />
          <Icon size={16} strokeWidth={1.5} className="relative" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[15px] font-semibold text-[var(--text-main)]">{title}</p>
          <p className="mt-0.5 text-[13px] text-[var(--text-light)]">{description}</p>
        </div>
      </div>
      <div className="shrink-0 pl-14 sm:pl-0">{children}</div>
    </li>
  );
}

/**
 * Cài đặt hiển thị trên thiết bị: giao diện sáng / tối và ngôn ngữ.
 * (Các công tắc 2FA / thông báo đẩy cũ chỉ lưu localStorage, không có tác dụng thật → đã bỏ; khi có API cài đặt tài khoản sẽ bổ sung.)
 */
export function SettingTab() {
  const t = useTranslations("ProfilePage.setting");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const changeLanguage = (next: AppLocale) => {
    if (next === locale || isPending) return;
    startTransition(() => router.replace(pathname, { locale: next }));
  };

  return (
    <ProfileSection flush>
      <ul className="divide-y divide-[var(--border)]">
        <SettingRow icon={Palette} title={t("appearance.title")} description={t("appearance.description")}>
          <AnimatedThemeToggler
            variant="circle"
            aria-label={t("appearance.title")}
            className="grid size-10 cursor-pointer place-items-center border border-[var(--border)] text-[var(--primary-ink)] transition-colors outline-none hover:border-[var(--primary-color)] focus-visible:ring-2 focus-visible:ring-[var(--ring)] [&_svg]:size-4"
          />
        </SettingRow>
        <SettingRow icon={Languages} title={t("language.title")} description={t("language.description")}>
          <ChoiceGroup<AppLocale>
            label={t("language.title")}
            variant="chip"
            value={locale}
            onChange={changeLanguage}
            options={[
              { value: "vi", label: t("language.vi"), disabled: isPending },
              { value: "en", label: t("language.en"), disabled: isPending },
            ]}
          />
        </SettingRow>
      </ul>
    </ProfileSection>
  );
}
