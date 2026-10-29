"use client";

import React, { type ReactNode } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ActionButton } from "@/components/shared/ActionButton";
import { TextField } from "@/components/shared/TextField";
import { TextAreaField } from "@/components/shared/TextAreaField";
import { useContact } from "../hooks/useContact";
import { optionKeys } from "../types/contact.types";

/** Nhãn nhóm chọn loại nhu cầu — cùng kiểu nhãn của TextField */
const LEGEND_CLASS = "text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--text-light)]";
const MESSAGE_MAX_LENGTH = 1000;

interface ContactFormProps {
  /** Lời dặn hiện nổi bật ở đầu form (vd. "Không cần biết trước số đo…") */
  intro?: ReactNode;
}

export function ContactForm({ intro }: ContactFormProps) {
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
    <form onSubmit={handleSubmit} className="bg-[var(--bg-main)] p-6 sm:p-10 xl:p-12">
      {intro ? (
        <p className="mb-8 flex gap-3 border-l-2 border-[var(--primary-color)] bg-[var(--bg-secondary)] px-4 py-3.5 text-sm leading-6 text-[var(--text-main)] sm:mb-10 sm:px-5 sm:py-4 sm:text-[15px] sm:leading-7">
          <Sparkles aria-hidden="true" className="mt-1 size-4 shrink-0 text-[var(--primary-ink)]" />
          <span>{intro}</span>
        </p>
      ) : null}

      {/* 2 cột khi đủ rộng; laptop nhỏ (cột form hẹp) xếp 1 cột cho khỏi chật */}
      <div className="grid gap-7 sm:grid-cols-2 sm:gap-8 lg:grid-cols-1 xl:grid-cols-2 xl:gap-10">
        <TextField
          required
          label={t("name")}
          autoComplete="name"
          placeholder={t("namePlaceholder")}
          value={formData.name}
          onValueChange={(value) => handleChange("name", value)}
        />
        <TextField
          required
          label={t("contact")}
          autoComplete="tel"
          placeholder={t("contactPlaceholder")}
          value={formData.contactInfo}
          onValueChange={(value) => handleChange("contactInfo", value)}
        />
      </div>

      {/* Loại nhu cầu: chọn một chạm bằng thẻ, không giấu trong dropdown */}
      <fieldset className="mt-8 sm:mt-10">
        <legend className={LEGEND_CLASS}>{t("requestType")}</legend>
        <div className="mt-3 flex flex-wrap gap-2 sm:mt-4 sm:gap-2.5">
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
              <span className="inline-flex min-h-10 items-center border border-[var(--border)] px-3.5 text-sm text-[var(--text-main)] transition-colors hover:border-[var(--primary-color)] peer-checked:border-[var(--primary-color)] peer-checked:bg-[var(--primary-color)] peer-checked:text-white peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--ring)] sm:px-4">
                {t(`options.${key}`)}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <TextAreaField
        required
        className="mt-8 sm:mt-10"
        label={t("message")}
        rows={2}
        autoResize
        maxLength={MESSAGE_MAX_LENGTH}
        showCount
        placeholder={t("messagePlaceholder")}
        value={formData.message}
        onValueChange={(value) => handleChange("message", value)}
      />

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

      <div className="mt-8 flex flex-col-reverse gap-5 sm:mt-10 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xs text-xs leading-5 text-[var(--text-light)]">{t("privacy")}</p>
        <ActionButton
          type="submit"
          variant="confirm"
          size="lg"
          loading={isSubmitting}
          icon={<ArrowRight />}
          iconPosition="end"
          className="w-full sm:w-auto"
        >
          {isSubmitting ? t("sending") : t("submit")}
        </ActionButton>
      </div>
    </form>
  );
}
