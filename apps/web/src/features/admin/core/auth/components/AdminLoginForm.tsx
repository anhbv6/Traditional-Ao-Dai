"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/routing";
import { AppLoading } from "@/components/shared";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS, AdminButton } from "@/features/admin/core/ui";
import { useAdminLogin } from "../hooks/useAdminLogin";
import { AdminLoginBackground } from "./AdminLoginBackground";
import { AdminLoginFormFields } from "./AdminLoginFormFields";

/**
 * Màn đăng nhập khu quản trị — kiểu "bảng điều khiển" đơn sắc (AGENTS.md §8), cố ý khác đăng nhập storefront
 * (storefront: ảnh 2 cột, chữ serif, đỏ đô): thanh trên mảnh, một thẻ đăng nhập giữa nền lưới chấm, chân trang thông tin phiên.
 * Chỉ email + mật khẩu (không đăng ký / OTP / Google — tài khoản nhân viên do ADMIN tạo).
 */
export function AdminLoginForm() {
  const { form, errors, isLoading, t, handleSubmit } = useAdminLogin();

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#FAFAFA]">
      <AppLoading visible={isLoading} />
      <AdminLoginBackground />

      {/* ---------- Thanh trên ---------- */}
      <header className="relative z-10 border-b border-[#E4E4E7] bg-white/80 backdrop-blur-md">
        <div className="flex h-14 w-full items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="size-8 shrink-0 overflow-hidden rounded-lg bg-white">
              <Image src="/logo.png" alt="" width={64} height={64} priority className="size-full object-contain p-0.5" />
            </span>
            <span className="truncate text-sm font-semibold text-[#09090B]">{t("brand")}</span>
          </div>
          <span className="hidden rounded-md border border-[#E4E4E7] bg-[#FAFAFA] px-1.5 py-0.5 text-2xs font-medium text-[#71717A] sm:inline">
            {t("eyebrow")}
          </span>
        </div>
      </header>

      {/* ---------- Thẻ đăng nhập ---------- */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <div className={cn(ADMIN_CARD_CLASS, "overflow-hidden shadow-[0_24px_48px_-24px_rgba(9,9,11,0.18)]")}>
            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8 sm:py-7" noValidate>
              {/* Tiêu đề thẻ chuẩn phân cấp visual hierarchy (§8): 20px -> nhãn 14px -> chú thích 13px */}
              <div className="space-y-1 text-center">
                <h1 className="text-xl font-semibold tracking-tight text-[#09090B]">{t("title")}</h1>
                <p className="text-xs text-[#71717A]">{t("staffOnly")}</p>
              </div>

              <AdminLoginFormFields form={form} errors={errors} disabled={isLoading} t={t} />

              <AdminButton
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                loadingText={t("submitting")}
                fullWidth
                icon={<ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />}
                iconPosition="end"
                className="group h-11 rounded-xl text-sm font-medium mb-3"
              >
                {t("submit")}
              </AdminButton>
              <Link
                href="/"
                className="flex justify-center h-8 shrink-0 items-center gap-1.5 rounded-lg text-xs font-medium text-[#71717A] transition-colors hover:underline hover:text-[#09090B]"
              >
                <ArrowLeft aria-hidden className="size-4" />
                {t("backToStore")}
              </Link>
            </form>
          </div>

          
        </div>
      </main>

      {/* ---------- Chân trang: thông tin phiên ---------- */}
      <footer className="relative z-10 border-t border-[#E4E4E7] bg-white/80 backdrop-blur-md">
        <p className="flex w-full justify-center items-center gap-2 px-5 py-3.5 text-xs leading-5 text-[#71717A] sm:items-center sm:px-8 lg:px-12">
          <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-600 sm:mt-0" strokeWidth={1.8} />
          {t("secureNote")}
        </p>
      </footer>
    </div>
  );
}
