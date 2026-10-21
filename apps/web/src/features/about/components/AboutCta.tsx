"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/shared/Reveal";
import { ActionLink } from "@/components/shared/ActionLink";
import { ON_PRIMARY_COLORS } from "@/components/shared/ActionButton";
import { containerClassName } from "@/components/layout/Container";

/** Lời mời cuối trang dạng dải ngang gọn: tiêu đề một bên, hành động một bên */
export function AboutCta() {
  const t = useTranslations("AboutPage.cta");

  return (
    <section className="bg-(--bg-wine) text-white">
      <Reveal className={containerClassName({ spacing: 'section', className: 'grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16' })}>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[3px] text-[var(--accent-color)]">{t("eyebrow")}</p>
          <h2 className="mt-4 max-w-2xl font-[family-name:var(--font-playfair)] text-[1.75rem] font-semibold leading-tight text-white sm:text-[2.375rem]">
            {t("title")}
          </h2>
          <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/70">{t("description")}</p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:flex-col lg:items-end">
          <ActionLink
            href="/contact"
            variant="custom"
            size="lg"
            colors={ON_PRIMARY_COLORS.solid}
            icon={<ArrowRight strokeWidth={1.6} />}
            iconPosition="end"
          >
            {t("primaryAction")}
          </ActionLink>
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
