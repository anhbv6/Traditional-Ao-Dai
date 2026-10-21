"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { ActionButton, ActionLink, AppLoading, type ActionColors } from "@/components/shared";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS } from "@/features/admin/core/ui";
import { useAdminLogin } from "../hooks/useAdminLogin";
import { AdminLoginBackground } from "./AdminLoginBackground";
import { AdminLoginFormFields } from "./AdminLoginFormFields";

// Màu đơn sắc admin cho ActionButton/ActionLink dùng chung (xem admin/variables.md)
const ADMIN_PRIMARY_COLORS: ActionColors = { bg: "#18181B", text: "#FFFFFF", border: "#18181B", hover: "#09090B" };
const ADMIN_GHOST_COLORS: ActionColors = { bg: "transparent", text: "#71717A", border: "transparent", hover: "#F4F4F5" };
// Bo góc + font Inter theo chuẩn admin thay cho kiểu storefront
const ADMIN_ACTION_CLASS = "rounded-xl font-(family-name:--font-admin)";

export function AdminLoginForm() {
  const { form, errors, isLoading, t, handleSubmit } = useAdminLogin();

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#FAFAFA] px-4 py-10">
      <AppLoading visible={isLoading} />
      <AdminLoginBackground />

      <div className="relative z-10 w-full max-w-[380px]">
        <div className="mb-6 flex items-center justify-center gap-2.5">
          <div className="size-8 overflow-hidden rounded-lg border border-[#E4E4E7] bg-white">
            <Image src="/logoPage.png" alt="" width={64} height={64} priority className="size-full scale-125 object-cover" />
          </div>
          <span className="text-sm font-semibold text-[#09090B]">{t("brand")}</span>
        </div>

        <div className={cn(ADMIN_CARD_CLASS, "p-6 sm:p-8")}>
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-[#09090B]">{t("title")}</h1>
            <p className="mt-1 text-sm text-[#71717A]">{t("subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            <AdminLoginFormFields form={form} errors={errors} disabled={isLoading} t={t} />

            <ActionButton
              type="submit"
              variant="custom"
              colors={ADMIN_PRIMARY_COLORS}
              loading={isLoading}
              fullWidth
              className={ADMIN_ACTION_CLASS}
            >
              {isLoading ? t("submitting") : t("submit")}
            </ActionButton>
          </form>
        </div>

        <div className="mt-6 flex justify-center">
          <ActionLink
            href="/"
            variant="custom"
            size="sm"
            colors={ADMIN_GHOST_COLORS}
            icon={<ArrowLeft />}
            className={ADMIN_ACTION_CLASS}
          >
            {t("backToStore")}
          </ActionLink>
        </div>
      </div>
    </div>
  );
}
