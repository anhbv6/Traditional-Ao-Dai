"use client";

import React from "react";
import { MessageCircle, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { useContact } from "../hooks/useContact";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { optionKeys } from "../types/contact.types";

export function ContactForm() {
  const t = useTranslations("ContactPage");
  const { formData, isSubmitting, isSuccess, error, handleChange, handleSubmit } = useContact();

  return (
    <div className="border border-[var(--border)] bg-[var(--bg-main)] p-4 sm:p-6 lg:p-7">
      <div className="mb-5 sm:mb-6 flex items-start gap-3 sm:gap-4">
        <span className="grid size-10 sm:size-12 shrink-0 place-items-center rounded-md bg-[var(--primary-color)] text-white">
          <MessageCircle className="size-5 sm:size-[21px]" />
        </span>
        <div>
          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent-color)]">{t("formSubtitle")}</p>
          <h2 className="mt-1.5 text-xl sm:text-2xl font-[family-name:var(--font-playfair)] font-bold text-[var(--primary-color)]">{t("formTitle")}</h2>
        </div>
      </div>

      {isSuccess && (
        <div className="mb-4 rounded-md bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 text-sm font-semibold">
          {t("successMessage") || "Cảm ơn bạn! Thông tin liên hệ đã được gửi thành công."}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-4 text-red-800 text-sm font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-bold text-[var(--text-main)] block">{t("name")}</span>
            <Input
              required
              className="mt-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-main)] focus:bg-white focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--ring)]/30 transition-colors"
              placeholder={t("namePlaceholder")}
              style={{ height: "44px" }}
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-[var(--text-main)] block">{t("phoneEmail")}</span>
            <Input
              required
              className="mt-1.5 rounded-md border border-[var(--border)] bg-[var(--bg-main)] focus:bg-white focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--ring)]/30 transition-colors"
              placeholder={t("contactPlaceholder")}
              style={{ height: "44px" }}
              value={formData.contactInfo}
              onChange={(e) => handleChange("contactInfo", e.target.value)}
            />
          </label>
        </div>

        <label className="block">
          <span className="text-xs font-bold text-[var(--text-main)] block">{t("requestType")}</span>
          <div className="mt-1.5">
            <Select 
              value={formData.requestType} 
              onValueChange={(val) => handleChange("requestType", val || "")}
            >
              <SelectTrigger
                className="flex w-full items-center justify-between gap-1.5 rounded-md border border-[var(--border)] !bg-[var(--bg-main)] px-3 py-2 font-[family-name:var(--font-lora)] text-sm text-[var(--text-main)] outline-none transition-colors focus-visible:border-[var(--primary-color)] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[var(--ring)]/30 hover:border-[var(--primary-color)] shadow-none"
                style={{ height: "44px" }}
              >
                <SelectValue placeholder={t("requestType")} />
              </SelectTrigger>
              <SelectContent className="bg-[var(--bg-main)] border border-[var(--border)] text-[var(--text-main)] shadow-md font-[family-name:var(--font-lora)]">
                <SelectGroup>
                  <SelectLabel>{t("requestType")}</SelectLabel>
                  {optionKeys.map((key) => (
                    <SelectItem key={key} value={t(`options.${key}`)} className="cursor-pointer">
                      {t(`options.${key}`)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </label>

        <label className="block">
          <span className="text-xs font-bold text-[var(--text-main)] block">{t("message")}</span>
          <textarea
            required
            rows={5}
            placeholder={t("messagePlaceholder")}
            className="mt-1.5 w-full resize-y rounded-md border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2.5 text-sm leading-6 text-[var(--text-main)] outline-none transition-colors placeholder:text-[var(--text-light)]/60 focus:bg-white focus:border-[var(--primary-color)] focus:ring-2 focus:ring-[var(--ring)]/30"
            value={formData.message}
            onChange={(e) => handleChange("message", e.target.value)}
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="justify-self-end inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-[var(--primary-color)] px-6 text-sm font-semibold text-white transition-colors hover:bg-[var(--accent-color)] sm:w-fit disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={17} />
          {isSubmitting ? t("sending") || "Đang gửi..." : t("submit")}
        </button>
      </form>
    </div>
  );
}
