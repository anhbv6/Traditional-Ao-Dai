import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { ActionLink } from "@/components/shared/ActionLink";
import { PageIntro } from "@/components/shared/PageIntro";
import type { TermsSection } from "../types/terms.types";

/**
 * Nội dung trang Điều khoản & Chính sách dịch vụ:
 * đầu trang + mục lục bám dính (desktop) + các mục điều khoản có neo `#id` + khối liên hệ cuối trang.
 * Server Component — nội dung lấy từ namespace `TermsPage`.
 */
export function TermsContent() {
  const t = useTranslations("TermsPage");
  const sections = t.raw("sections") as TermsSection[];

  return (
    <>
      <PageIntro eyebrow={t("eyebrow")} title={t("title")} subtitle={t("subtitle")} />

      <div className="mt-12 grid gap-10 border-t border-[var(--border)] pt-10 sm:mt-16 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
        {/* Mục lục */}
        <nav aria-label={t("tocLabel")} className="hidden lg:block">
          <div className="sticky top-28">
            <p className="text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--primary-ink)]">{t("tocLabel")}</p>
            <ol className="mt-5 space-y-1 border-l border-[var(--border)]">
              {sections.map((section) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="-ml-px block border-l border-transparent py-1.5 pl-4 text-[13px] leading-5 text-[var(--text-light)] transition-colors hover:border-[var(--primary-color)] hover:text-[var(--primary-ink)]"
                  >
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        {/* Nội dung điều khoản */}
        <article className="max-w-3xl">
          <p className="text-xs italic text-[var(--text-light)]">
            {t("lastUpdated", { date: t("updatedDate") })}
          </p>

          <div className="mt-8 space-y-10 sm:space-y-12">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-28">
                <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[var(--text-main)] sm:text-2xl">
                  {section.title}
                </h2>
                <div className="mt-4 space-y-3 text-[15px] leading-7 text-[var(--text-light)]">
                  {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  {section.items?.length ? (
                    <ul className="space-y-2.5">
                      {section.items.map((item) => (
                        <li key={item} className="flex gap-3">
                          <span aria-hidden="true" className="mt-3 size-1.5 shrink-0 rotate-45 bg-[var(--primary-color)]" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              </section>
            ))}
          </div>

          {/* Liên hệ */}
          <div className="mt-14 flex flex-col gap-5 border border-[var(--border)] bg-[var(--bg-card)] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <p className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[var(--primary-ink)]">
                {t("contactTitle")}
              </p>
              <p className="mt-1 text-sm text-[var(--text-light)]">{t("contactText")}</p>
            </div>
            <ActionLink href="/contact" variant="confirm" icon={<ArrowRight />} iconPosition="end" className="shrink-0">
              {t("contactCta")}
            </ActionLink>
          </div>
        </article>
      </div>
    </>
  );
}
