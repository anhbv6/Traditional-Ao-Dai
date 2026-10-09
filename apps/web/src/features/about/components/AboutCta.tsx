"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/shared/Reveal";

/** Lời mời cuối trang dạng dải ngang gọn: tiêu đề một bên, hành động một bên */
export function AboutCta() {
  const t = useTranslations("AboutPage.cta");

  return (
    <section className="bg-[#2A0A12] text-white">
      <Reveal className="mx-auto grid w-full max-w-[1440px] gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16 lg:px-10 xl:px-16">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[3px] text-[var(--accent-color)]">{t("eyebrow")}</p>
          <h2 className="mt-4 max-w-2xl font-[family-name:var(--font-playfair)] text-[28px] font-semibold leading-tight text-white sm:text-[38px]">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/70">{t("description")}</p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:flex-col lg:items-end">
          <Link
            href="/contact"
            className="group inline-flex min-h-12 items-center justify-center gap-3 bg-white px-8 text-xs font-semibold uppercase tracking-[2px] text-[var(--primary-color)] transition-colors duration-300 hover:bg-[var(--accent-color)] hover:text-white"
          >
            {t("primaryAction")}
            <ArrowRight size={16} strokeWidth={1.6} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
          <Link
            href="/faqs"
            className="text-xs uppercase tracking-[2px] text-white/70 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            {t("secondaryAction")}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
