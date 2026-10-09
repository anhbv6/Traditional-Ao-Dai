"use client";

import Image from "next/image";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "@/lib/utils";
import { ClipReveal } from "@/components/shared/ClipReveal";
import { AboutHeading } from "./AboutHeading";
import { fitProfiles, type FitProfile } from "../types/about.types";

const STAT_KEYS: Record<FitProfile["id"], readonly string[]> = {
  slender: ["shoulder", "waist", "panel"],
  curvy: ["armhole", "belly", "hip"],
};

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Chọn vóc dáng -> ảnh mờ chéo sang dáng mới, số liệu và so sánh trước/sau đổi theo.
 * Phần so sánh nằm ngoài ảnh (không đè lên mặt người mẫu) cho dễ đọc.
 */
export function FitModel() {
  const t = useTranslations("AboutPage.fit");
  const [activeProfileId, setActiveProfileId] = useState<FitProfile["id"]>(fitProfiles[0].id);
  const activeProfile = fitProfiles.find((profile) => profile.id === activeProfileId) ?? fitProfiles[0];

  return (
    <section className="mx-auto w-full max-w-[1440px] px-5 pb-20 sm:px-8 sm:pb-28 lg:px-10 xl:px-16">
      <AboutHeading numeral="II" eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      {/* Ảnh bên trái, điều khiển bên phải — ngược với bố cục chữ trái / ảnh phải của trang chủ */}
      <div className="grid gap-12 lg:grid-cols-[0.85fr_1fr] lg:items-center lg:gap-20">
        <div className="lg:order-2">
          <div role="tablist" aria-label={t("eyebrow")} className="flex border-b border-[var(--border)]">
            {fitProfiles.map((profile) => {
              const isActive = profile.id === activeProfile.id;
              return (
                <button
                  key={profile.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActiveProfileId(profile.id)}
                  className={cn(
                    "relative -mb-px cursor-pointer px-1 pb-3 pr-6 text-left text-sm font-semibold transition-colors duration-500",
                    isActive ? "text-[var(--primary-color)]" : "text-[var(--text-light)] hover:text-[var(--primary-color)]",
                  )}
                >
                  {t(`profiles.${profile.id}.label`)}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute bottom-0 left-0 right-6 h-0.5 origin-left bg-[var(--primary-color)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]",
                      isActive ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeProfile.id}
              role="tabpanel"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.6, ease: EASE }}
            >
              <p className="mt-6 text-[15px] leading-7 text-[var(--text-main)]/85">{t(`profiles.${activeProfile.id}.note`)}</p>

              <dl className="mt-8 grid grid-cols-3 divide-x divide-[var(--border)] border-y border-[var(--border)]">
                {STAT_KEYS[activeProfile.id].map((key) => (
                  <div key={key} className="flex flex-col-reverse justify-end px-4 py-5 first:pl-0">
                    <dt className="mt-1 text-[11px] uppercase tracking-[1.8px] text-[var(--text-light)]">
                      {t(`profiles.${activeProfile.id}.stats.${key}.label`)}
                    </dt>
                    <dd className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[var(--primary-color)] sm:text-2xl">
                      {t(`profiles.${activeProfile.id}.stats.${key}.value`)}
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-8 text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--text-light)]">{t("compareLabel")}</p>
              <div className="mt-3 grid gap-px bg-[var(--border)] sm:grid-cols-2">
                <div className="bg-[var(--bg-main)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[2px] text-[var(--text-light)]">{t("beforeLabel")}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-light)]">{t(`profiles.${activeProfile.id}.before`)}</p>
                </div>
                <div className="bg-white p-5 shadow-[inset_3px_0_0_var(--primary-color)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[2px] text-[var(--primary-color)]">{t("afterLabel")}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-main)]">{t(`profiles.${activeProfile.id}.after`)}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative mx-auto w-full max-w-[520px] lg:order-1 lg:ml-0">
          {/* Lần đầu cuộn tới: ảnh mở từ trái sang như kéo màn */}
          <ClipReveal direction="right" className="aspect-[4/5] bg-[var(--bg-main)]">
            {/* Xếp chồng cả 2 ảnh, chỉ đổi độ mờ -> chuyển mượt, không nháy khi tải ảnh */}
            {fitProfiles.map((profile) => (
              <Image
                key={profile.id}
                src={profile.image}
                alt={t(`profiles.${profile.id}.imageAlt`)}
                fill
                sizes="(max-width: 1024px) 90vw, 520px"
                className={cn(
                  "object-cover transition-[opacity,transform] duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                  profile.id === activeProfile.id ? "scale-100 opacity-100" : "scale-[1.04] opacity-0",
                )}
              />
            ))}
            <p className="absolute bottom-5 left-5 bg-white/95 px-4 py-2 font-[family-name:var(--font-playfair)] text-sm italic text-[var(--primary-color)]">
              {t(`profiles.${activeProfile.id}.label`)}
            </p>
          </ClipReveal>
        </div>
      </div>
    </section>
  );
}
