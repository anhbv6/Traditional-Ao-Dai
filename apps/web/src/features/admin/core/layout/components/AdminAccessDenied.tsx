"use client";

import React from "react";
import { Shield } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";

export function AdminAccessDenied() {
  const t = useTranslations("AdminPage.accessDenied");

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md bg-white p-8 rounded-xl border border-[#E4E4E7] shadow-2xs space-y-4">
        <div className="size-12 mx-auto rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
          <Shield size={24} />
        </div>
        <h2 className="text-lg font-bold text-[#09090B]">{t("title")}</h2>
        <p className="text-xs text-[#71717A]">
          {t("description")}
        </p>
        <Link
          href="/admin/dashboard"
          className="inline-flex h-9 items-center justify-center px-4 rounded-lg bg-[#18181B] text-white text-xs font-medium hover:bg-[#09090B] transition-colors"
        >
          {t("backToDashboard")}
        </Link>
      </div>
    </div>
  );
}
