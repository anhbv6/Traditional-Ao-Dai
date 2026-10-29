"use client";

import React from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Loader2, LockKeyhole, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/routing";
import { AppLoading } from "@/components/shared";
import { cn } from "@/lib/utils";
import { ADMIN_CARD_CLASS } from "@/features/admin/core/ui";
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
        <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="size-8 shrink-0 overflow-hidden rounded-lg border border-[#E4E4E7] bg-white">
              <Image src="/logo.png" alt="" width={64} height={64} priority className="size-full object-contain p-0.5" />
            </span>
            <span className="truncate text-sm font-semibold text-[#09090B]">{t("brand")}</span>
            <span className="hidden rounded-md border border-[#E4E4E7] bg-[#FAFAFA] px-1.5 py-0.5 text-[11px] font-medium text-[#71717A] sm:inline">
              {t("eyebrow")}
            </span>
          </div>
          <Link
            href="/"
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-[#71717A] transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B]"
          >
            <ArrowLeft aria-hidden className="size-4" />
            {t("backToStore")}
          </Link>
        </div>
      </header>

      {/* ---------- Thẻ đăng nhập ---------- */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <div className={cn(ADMIN_CARD_CLASS, "overflow-hidden shadow-[0_24px_48px_-24px_rgba(9,9,11,0.18)]")}>
            <div className="border-b border-[#E4E4E7] bg-[#FAFAFA] px-6 py-5 sm:px-8">
              <span className="grid size-10 place-items-center rounded-xl bg-[#18181B] text-white">
                <LockKeyhole aria-hidden className="size-[18px]" strokeWidth={1.8} />
              </span>
              <h1 className="mt-4 text-xl font-semibold tracking-tight text-[#09090B]">{t("title")}</h1>
              <p className="mt-1 text-sm text-[#71717A]">{t("subtitle")}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6 sm:px-8 sm:py-7" noValidate>
              <AdminLoginFormFields form={form} errors={errors} disabled={isLoading} t={t} />

              <button
                type="submit"
                disabled={isLoading}
                className="group inline-flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#18181B] text-sm font-medium text-white shadow-2xs transition-colors hover:bg-[#09090B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18181B] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? <Loader2 aria-hidden className="size-4 animate-spin" /> : null}
                {isLoading ? t("submitting") : t("submit")}
                {isLoading ? null : (
                  <ArrowRight aria-hidden className="size-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                )}
              </button>
            </form>
          </div>

          <p className="mt-5 px-2 text-center text-xs leading-5 text-[#71717A]">{t("staffOnly")}</p>
        </div>
      </main>

      {/* ---------- Chân trang: thông tin phiên ---------- */}
      <footer className="relative z-10 border-t border-[#E4E4E7] bg-white/80 backdrop-blur-md">
        <p className="mx-auto flex w-full max-w-[1440px] items-start gap-2 px-5 py-3.5 text-xs leading-5 text-[#71717A] sm:items-center sm:px-8 lg:px-12">
          <ShieldCheck aria-hidden className="mt-0.5 size-4 shrink-0 text-emerald-600 sm:mt-0" strokeWidth={1.8} />
          {t("secureNote")}
        </p>
      </footer>
    </div>
  );
}
