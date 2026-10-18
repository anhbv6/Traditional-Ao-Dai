"use client";

import React from "react";
import { ArrowRight, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { ActionLink } from "@/components/shared/ActionLink";
import { Reveal } from "@/components/shared/Reveal";
import { SectionIntro } from "@/components/shared/SectionIntro";
import { CONTACT_CHANNELS } from "@/features/contact";

/** Cuối trang: chưa tìm thấy câu trả lời thì dẫn sang trang Liên hệ hoặc gọi hotline */
export function FaqsCta() {
  const t = useTranslations("FaqsPage.cta");

  return (
    <Reveal className="mt-16 grid gap-8 border-t border-[var(--text-main)]/80 pt-10 sm:mt-20 sm:pt-12 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16">
      <SectionIntro eyebrow={t("eyebrow")} title={t("title")} description={t("description")} className="[&_h2]:max-w-xl [&_p:last-child]:max-w-xl" />

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-8">
        <ActionLink href="/contact" variant="confirm" size="lg" icon={<ArrowRight />} iconPosition="end" className="w-full sm:w-auto">
          {t("contact")}
        </ActionLink>
        <a
          href={CONTACT_CHANNELS.phoneHref}
          className="group inline-flex w-fit items-center gap-2.5 border-b border-[var(--text-main)]/40 pb-1.5 text-xs font-semibold uppercase tracking-[2px] text-[var(--text-main)] transition-colors hover:border-[var(--primary-color)] hover:text-[var(--primary-ink)]"
        >
          <Phone size={14} strokeWidth={1.6} />
          {t("call")}
        </a>
      </div>
    </Reveal>
  );
}
