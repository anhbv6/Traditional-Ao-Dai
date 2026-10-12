"use client";

import React, { useTransition } from "react";
import { useLocalStorageBoolean } from "@/hooks/useLocalStorageBoolean";
import { useTranslations, useLocale } from "next-intl";
import { ChevronDown } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { usePathname, useRouter } from "@/i18n/routing";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";

export function SettingTab() {
  const t = useTranslations("ProfilePage.setting");
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Tùy chọn hiển thị lưu ở trình duyệt (chưa có API cài đặt tài khoản)
  const [twoFactor, setTwoFactor] = useLocalStorageBoolean("2fa", true);
  const [pushNotifications, setPushNotifications] = useLocalStorageBoolean("push", true);
  const [desktopNotifications, setDesktopNotifications] = useLocalStorageBoolean("desktop", true);
  const [emailNotifications, setEmailNotifications] = useLocalStorageBoolean("email", true);

  const handleLanguageChange = (newLocale: string) => {
    if (newLocale === currentLocale || isPending) return;
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };


  return (
    <div className="rounded-2xl border border-[var(--primary-color)]/10 bg-[var(--bg-card)] p-6 shadow-sm sm:p-8 animate-fade-in">
      {/* Header */}
      <div className="border-b border-[var(--border)]/60 pb-5 mb-2">
        <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-[var(--primary-ink)]">
          {t("title")}
        </h2>
        <p className="mt-1 text-sm text-[var(--text-light)]">
          {t("subtitle")}
        </p>
      </div>

      <div className="divide-y divide-[var(--border)]/30">
        {/* Appearance Row */}
        <div className="flex items-center justify-between py-5">
          <div className="space-y-1 pr-4">
            <h3 className="font-semibold text-[var(--text-main)] text-sm sm:text-base">
              {t("appearance.title")}
            </h3>
            <p className="text-xs text-[var(--text-light)]">
              {t("appearance.description")}
            </p>
          </div>
          <div className="shrink-0 z-30 flex items-center">
            <AnimatedThemeToggler
              variant="circle"
              className="flex size-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--bg-main)]/50 text-[var(--text-light)] hover:border-[var(--primary-color)] hover:text-[var(--primary-ink)] transition-colors cursor-pointer outline-none shadow-xs [&_svg]:size-4"
            />
          </div>
        </div>

        {/* Language Row */}
        <div className="flex items-center justify-between py-5">
          <div className="space-y-1 pr-4">
            <h3 className="font-semibold text-[var(--text-main)] text-sm sm:text-base">
              {t("language.title")}
            </h3>
            <p className="text-xs text-[var(--text-light)]">
              {t("language.description")}
            </p>
          </div>
          <div className="shrink-0 z-20">
            <Popover>
              <PopoverTrigger render={
                <button
                  type="button"
                  disabled={isPending}
                  className="flex h-9 items-center justify-between gap-2.5 rounded-lg border border-[var(--border)] bg-[var(--bg-main)]/50 px-3.5 text-xs font-semibold text-[var(--text-main)] hover:border-[var(--primary-color)] transition-colors cursor-pointer outline-none shadow-xs min-w-[100px]"
                >
                  <span>{currentLocale === "vi" ? "Tiếng Việt" : "English"}</span>
                  <ChevronDown size={14} className="text-[var(--text-light)]" />
                </button>
              } />
              <PopoverContent className="w-36 p-1 bg-[var(--bg-card)] border border-[var(--border)] rounded-xl shadow-lg z-50">
                <button
                  onClick={() => handleLanguageChange("en")}
                  disabled={isPending}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-left cursor-pointer transition-colors ${
                    currentLocale === "en"
                      ? "bg-[var(--primary-color)] text-white"
                      : "text-[var(--text-main)] hover:bg-[var(--bg-main)]"
                  }`}
                >
                  <span>English</span>
                </button>
                <button
                  onClick={() => handleLanguageChange("vi")}
                  disabled={isPending}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-left cursor-pointer transition-colors ${
                    currentLocale === "vi"
                      ? "bg-[var(--primary-color)] text-white"
                      : "text-[var(--text-main)] hover:bg-[var(--bg-main)]"
                  }`}
                >
                  <span>Tiếng Việt</span>
                </button>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Two-factor Authentication Row */}
        <div className="flex items-center justify-between py-5">
          <div className="space-y-1 pr-4">
            <h3 className="font-semibold text-[var(--text-main)] text-sm sm:text-base">
              {t("twoFactor.title")}
            </h3>
            <p className="text-xs text-[var(--text-light)]">
              {t("twoFactor.description")}
            </p>
          </div>
          <div className="shrink-0 flex items-center">
            <Switch
              checked={twoFactor}
              onCheckedChange={(val) => setTwoFactor(val)}
              className="cursor-pointer"
            />
          </div>
        </div>

        {/* Push Notifications Row */}
        <div className="flex items-center justify-between py-5">
          <div className="space-y-1 pr-4">
            <h3 className="font-semibold text-[var(--text-main)] text-sm sm:text-base">
              {t("push.title")}
            </h3>
            <p className="text-xs text-[var(--text-light)]">
              {t("push.description")}
            </p>
          </div>
          <div className="shrink-0 flex items-center">
            <Switch
              checked={pushNotifications}
              onCheckedChange={(val) => setPushNotifications(val)}
              className="cursor-pointer"
            />
          </div>
        </div>

        {/* Desktop Notification Row */}
        <div className="flex items-center justify-between py-5">
          <div className="space-y-1 pr-4">
            <h3 className="font-semibold text-[var(--text-main)] text-sm sm:text-base">
              {t("desktop.title")}
            </h3>
            <p className="text-xs text-[var(--text-light)]">
              {t("desktop.description")}
            </p>
          </div>
          <div className="shrink-0 flex items-center">
            <Switch
              checked={desktopNotifications}
              onCheckedChange={(val) => setDesktopNotifications(val)}
              className="cursor-pointer"
            />
          </div>
        </div>

        {/* Email Notifications Row */}
        <div className="flex items-center justify-between py-5 last:pb-0">
          <div className="space-y-1 pr-4">
            <h3 className="font-semibold text-[var(--text-main)] text-sm sm:text-base">
              {t("email.title")}
            </h3>
            <p className="text-xs text-[var(--text-light)]">
              {t("email.description")}
            </p>
          </div>
          <div className="shrink-0 flex items-center">
            <Switch
              checked={emailNotifications}
              onCheckedChange={(val) => setEmailNotifications(val)}
              className="cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
