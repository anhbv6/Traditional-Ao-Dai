"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { fitProfiles, type FitProfile } from "../types/about.types";

export function FitModel() {
  const t = useTranslations("AboutPage.fit");
  const [activeProfileId, setActiveProfileId] = useState<FitProfile["id"]>(fitProfiles[0].id);
  const activeProfile = useMemo(
    () => fitProfiles.find((profile) => profile.id === activeProfileId) ?? fitProfiles[0],
    [activeProfileId]
  );
  const statKeys = activeProfile.id === "slender" ? ["shoulder", "waist", "panel"] : ["armhole", "belly", "hip"];

  return (
    <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[2.5px] text-[#800020]">{t("eyebrow")}</p>
        <h2 className="mt-2 max-w-xl font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[#800020] sm:text-4xl">
          {t("title")}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-[#706565] sm:text-base">{t("description")}</p>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {fitProfiles.map((profile) => (
            <button
              key={profile.id}
              type="button"
              onClick={() => setActiveProfileId(profile.id)}
              className={cn(
                "cursor-pointer rounded-md border p-4 text-left transition-all",
                activeProfile.id === profile.id
                  ? "border-[#800020] bg-white shadow-[0_16px_36px_rgba(128,0,32,0.12)]"
                  : "border-[#E2D9D2] bg-[#FAF7F5] hover:border-[#E2A79E] hover:bg-white"
              )}
            >
              <span className="text-sm font-semibold text-[#800020]">{t(`profiles.${profile.id}.label`)}</span>
              <span className="mt-2 block text-sm leading-6 text-[#706565]">{t(`profiles.${profile.id}.note`)}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {statKeys.map((key) => (
            <div key={key} className="rounded-md border border-[#E2D9D2] bg-white px-4 py-3">
              <p className="text-xs uppercase tracking-[1.8px] text-[#706565]">
                {t(`profiles.${activeProfile.id}.stats.${key}.label`)}
              </p>
              <p className="mt-1 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#800020]">
                {t(`profiles.${activeProfile.id}.stats.${key}.value`)}
              </p>
            </div>
          ))}
        </div>
      </div>

      <motion.div
        key={activeProfile.id}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-md bg-[#F3ECE7]"
      >
        <div className="relative min-h-[calc(100vh-190px)] overflow-hidden">
          <Image
            src={activeProfile.image}
            alt={t(`profiles.${activeProfile.id}.imageAlt`)}
            fill
            unoptimized
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#2A2525]/72 via-[#2A2525]/10 to-transparent" />
          <div className="absolute inset-x-4 bottom-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-md border border-white/25 bg-white/92 p-4 backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[2px] text-[#B42318]">{t("beforeLabel")}</p>
              <p className="mt-2 text-sm leading-6 text-[#2A2525]">{t(`profiles.${activeProfile.id}.before`)}</p>
            </div>
            <div className="rounded-md border border-white/25 bg-[#800020]/92 p-4 text-white backdrop-blur">
              <p className="text-xs font-bold uppercase tracking-[2px] text-[#E2A79E]">{t("afterLabel")}</p>
              <p className="mt-2 text-sm leading-6">{t(`profiles.${activeProfile.id}.after`)}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
