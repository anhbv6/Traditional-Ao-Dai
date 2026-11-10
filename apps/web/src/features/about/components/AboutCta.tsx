"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Link } from "@/i18n/routing";
import { Reveal } from "@/components/shared/Reveal";
import { ActionLink } from "@/components/shared/ActionLink";
import { ON_PRIMARY_COLORS } from "@/components/shared/ActionButton";
import { containerClassName } from "@/components/layout/Container";

/**
 * Lời mời tư vấn may đo cuối trang (Minimalism Style):
 * - Băng ngang kiến trúc phẳng trên nền sẫm (--bg-wine), viền hairline sắc nét.
 * - Toàn bộ văn bản đạt chuẩn tương phản cao (từ 8:1 tới 17:1), rõ ràng trong mọi điều kiện ánh sáng.
 * - Hai lựa chọn hành động trực diện, mạch lạc.
 */
export function AboutCta() {
  const t = useTranslations("AboutPage.cta");

  return (
    <section className="border-t border-(--border)/20 bg-(--bg-wine) text-white">
      <Reveal
        className={containerClassName({
          spacing: "section",
          className: "grid gap-10 lg:grid-cols-[1fr_auto] lg:items-center lg:gap-16",
        })}
      >
        <div className="max-w-2xl">
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="h-px w-6 bg-(--accent-on-primary)/60" />
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-(--accent-on-primary)">
              {t("eyebrow")}
            </p>
          </div>

          <h2 className="mt-4 font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-[1.2] text-white sm:text-3xl lg:text-[2.25rem]">
            {t("title")}
          </h2>

          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-white/90 sm:text-base sm:leading-relaxed">
            {t("description")}
          </p>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:flex-col lg:items-end">
          <ActionLink
            href="/contact"
            variant="custom"
            size="lg"
            colors={ON_PRIMARY_COLORS.solid}
            icon={<ArrowRight strokeWidth={1.8} />}
            iconPosition="end"
          >
            {t("primaryAction")}
          </ActionLink>

          <Link
            href="/faqs"
            className="text-xs font-medium uppercase tracking-[0.2em] text-white/85 underline-offset-6 transition-colors hover:text-white hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
          >
            {t("secondaryAction")}
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
