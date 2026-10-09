"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useContact } from "../hooks/useContact";
import { optionKeys } from "../types/contact.types";

/** Ô nhập kiểu gạch chân — nhẹ hơn ô viền hộp, hợp với nền giấy kem của storefront */
const fieldClass =
  "mt-2 block w-full border-0 border-b border-[var(--border)] bg-transparent px-0 py-2.5 text-[15px] text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-light)]/55 focus:border-[var(--primary-color)]";
const labelClass = "text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--text-light)]";

export function ContactForm() {
  const t = useTranslations("ContactPage.form");
  const tCommon = useTranslations("Common");
  const { formData, isSubmitting, isSuccess, error, handleChange, handleSubmit } = useContact();

  const errorMessage = error
    ? t.has(error as Parameters<typeof t.has>[0])
      ? t(error as Parameters<typeof t>[0])
      : tCommon.has(`errors.${error}` as Parameters<typeof tCommon.has>[0])
        ? tCommon(`errors.${error}` as Parameters<typeof tCommon>[0])
        : t("sendError")
    : null;

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--bg-main)] p-6 sm:p-10 lg:p-12">
      <div className="grid gap-8 sm:grid-cols-2 sm:gap-10">
        <label className="block">
          <span className={labelClass}>{t("name")}</span>
          <input
            required
            autoComplete="name"
            className={fieldClass}
            placeholder={t("namePlaceholder")}
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
        </label>
        <label className="block">
          <span className={labelClass}>{t("contact")}</span>
          <input
            required
            autoComplete="tel"
            className={fieldClass}
            placeholder={t("contactPlaceholder")}
            value={formData.contactInfo}
            onChange={(e) => handleChange("contactInfo", e.target.value)}
          />
        </label>
      </div>

      {/* Loại nhu cầu: chọn một chạm bằng thẻ, không giấu trong dropdown */}
      <fieldset className="mt-10">
        <legend className={labelClass}>{t("requestType")}</legend>
        <div className="mt-4 flex flex-wrap gap-2.5">
          {optionKeys.map((key) => (
            <label key={key} className="cursor-pointer">
              <input
                type="radio"
                name="requestType"
                value={key}
                checked={formData.requestType === key}
                onChange={() => handleChange("requestType", key)}
                className="peer sr-only"
              />
              <span className="inline-flex min-h-10 items-center border border-[var(--border)] px-4 text-sm text-[var(--text-main)] transition-colors hover:border-[var(--primary-color)] peer-checked:border-[var(--primary-color)] peer-checked:bg-[var(--primary-color)] peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--ring)]">
                {t(`options.${key}`)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-10 block">
        <span className={labelClass}>{t("message")}</span>
        <textarea
          required
          rows={4}
          placeholder={t("messagePlaceholder")}
          className={cn(fieldClass, "resize-y leading-7")}
          value={formData.message}
          onChange={(e) => handleChange("message", e.target.value)}
        />
      </label>

      {isSuccess || errorMessage ? (
        <p
          role="status"
          className={cn(
            "mt-8 border-l-2 py-1 pl-4 text-sm leading-6",
            isSuccess ? "border-[var(--primary-color)] text-[var(--text-main)]" : "border-[var(--destructive)] text-[var(--destructive)]"
          )}
        >
          {isSuccess ? t("success") : errorMessage}
        </p>
      ) : null}

      <div className="mt-10 flex flex-col-reverse gap-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xs text-xs leading-5 text-[var(--text-light)]">{t("privacy")}</p>
        <button
          type="submit"
          disabled={isSubmitting}
          className="group inline-flex min-h-12 cursor-pointer items-center justify-center gap-3 bg-[var(--primary-color)] px-8 text-xs font-semibold uppercase tracking-[2px] text-white transition-colors duration-300 hover:bg-[#2A0A12] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t("sending") : t("submit")}
          <ArrowRight size={16} strokeWidth={1.6} className="transition-transform duration-300 group-hover:translate-x-1" />
        </button>
      </div>
    </form>
  );
}
