"use client";

import React from "react";
import { Link } from "@/i18n/routing";
import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { useAdminLogin } from "../hooks/useAdminLogin";
import { AdminLoginBackground } from "./AdminLoginBackground";
import { AdminLoginFormFields } from "./AdminLoginFormFields";
import { LoadingOverlay } from "@/components/shared";

export function AdminLoginForm() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    errors,
    isLoading,
    t,
    handleSubmit,
  } = useAdminLogin();

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden font-[family-name:var(--font-geist-sans)] animate-pastel-flow px-4 py-12 select-none">
      <LoadingOverlay visible={isLoading} messageKey="verifying" />
      <AdminLoginBackground />
      {/* Centered Luxury Glassmorphic Admin Card */}
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-[440px] bg-white/85 backdrop-blur-2xl border border-white/90 rounded-3xl p-7 sm:p-9 shadow-[0_20px_50px_rgba(15,23,42,0.06),0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-zinc-950/[0.04] z-10 relative overflow-hidden"
      >
        <div className="mb-7 text-center">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 mt-1">
            {t("title")}
          </h1>
          
          <p className="text-xs text-zinc-600 mt-1">
            {t("subtitle")}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <AdminLoginFormFields
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            rememberMe={rememberMe}
            setRememberMe={setRememberMe}
            errors={errors}
            t={t}
          />

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-zinc-900 hover:bg-black text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-md shadow-zinc-900/15 flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed active:scale-[0.99] cursor-pointer group"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin text-white" />
                  <span>{t("submitting")}</span>
                </>
              ) : (
                <>
                  <span>{t("submit")}</span>
                  <ArrowRight
                    size={16}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Back to store navigation */}
        <div className="w-full max-w-[440px] mt-4 flex items-center justify-center z-20">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 hover:text-zinc-950 backdrop-blur-md transition-all group cursor-pointer hover:underline"
          >
            <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" />
            <span>{t("backToStore")}</span>
          </Link>
        </div>

        <div className="mt-4 pt-4 border-t border-zinc-200/60 flex items-center justify-center gap-1.5 text-[10px] text-nowrap text-zinc-600 sm:text-[12px]">
          <ShieldCheck size={13} className="text-emerald-700 shrink-0" />
          <span>{t("securityBadge")}</span>
        </div>
      </motion.div>
    </div>
  );
}
