"use client";

import Image from "next/image";
import { useRef } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight, CheckCircle2, HeartHandshake, Ruler, Scissors, Sparkles } from "lucide-react";
import { useAbout } from "../hooks/useAbout";
import { SnapSection } from "./SnapSection";
import { FitModel } from "./FitModel";
import { TestimonialSlider } from "./TestimonialSlider";
import { atelierStories } from "../types/about.types";

export function AboutExperience() {
  const t = useTranslations("AboutPage");
  const rootRef = useRef<HTMLDivElement>(null);
  useAbout(rootRef);

  return (
    <div ref={rootRef} className="overflow-hidden bg-[#FAF7F5]">
      <SnapSection id="hero">
        <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[3px] text-[#800020]">{t("hero.eyebrow")}</p>
            <h1 className="mt-4 max-w-3xl font-[family-name:var(--font-playfair)] text-[42px] font-semibold leading-[1.08] text-[#800020] sm:text-[58px] lg:text-[72px]">
              {t("hero.title")}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#2A2525] sm:text-lg">{t("hero.subtitle")}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {(["armhole", "belly", "realFit"] as const).map((key) => (
                <span
                  key={key}
                  className="inline-flex min-h-10 items-center gap-2 rounded-md border border-[#800020]/15 bg-white px-4 text-sm font-semibold text-[#800020]"
                >
                  <CheckCircle2 size={16} />
                  {t(`hero.badges.${key}`)}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[690px]">
            <div className="relative min-h-[calc(100vh-220px)] overflow-hidden rounded-md bg-[#F3ECE7]">
              <Image
                src="https://cdn.pixabay.com/photo/2021/04/16/07/22/ao-dai-6182834_1280.jpg"
                alt={t("hero.imageAlt")}
                fill
                priority
                unoptimized
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2A2525]/64 via-transparent to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 rounded-md border border-white/25 bg-white/90 p-5 shadow-sm backdrop-blur sm:left-auto sm:max-w-[320px]">
                <p className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#800020]">{t("hero.measureTitle")}</p>
                <p className="mt-2 text-sm leading-6 text-[#706565]">{t("hero.measureText")}</p>
              </div>
            </div>
          </div>
        </div>
      </SnapSection>

      <SnapSection id="pain-solution">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[2.5px] text-[#800020]">{t("pain.eyebrow")}</p>
            <h2 className="mt-2 max-w-xl font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[#800020] sm:text-4xl">
              {t("pain.title")}
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#706565] sm:text-base">{t("pain.description")}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { key: "armhole", icon: Ruler },
              { key: "belly", icon: Sparkles },
              { key: "fit", icon: Scissors },
            ].map(({ key, icon: Icon }) => (
              <div key={key} className="rounded-md border border-[#E2D9D2] bg-white p-5 shadow-sm">
                <div className="grid size-11 place-items-center rounded-md bg-[#F3ECE7] text-[#800020]">
                  <Icon size={20} />
                </div>
                <h3 className="mt-5 font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#800020]">
                  {t(`pain.cards.${key}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#706565]">{t(`pain.cards.${key}.text`)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-md border border-[#800020]/12 bg-[#800020] p-6 text-white sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[2.5px] text-[#E2A79E]">{t("pain.solutionEyebrow")}</p>
              <p className="mt-3 max-w-4xl font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-snug sm:text-3xl">
                {t("pain.solutionText")}
              </p>
            </div>
            <ArrowRight className="hidden text-[#E2A79E] lg:block" size={34} />
          </div>
        </div>
      </SnapSection>

      <SnapSection id="fit-model" className="border-y border-[#E2D9D2]">
        <FitModel />
      </SnapSection>

      <SnapSection id="atelier">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[2.5px] text-[#800020]">{t("atelier.eyebrow")}</p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[#800020] sm:text-4xl">
            {t("atelier.title")}
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#706565] sm:text-base">{t("atelier.description")}</p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {atelierStories.map((story) => (
            <article key={story.id} className="overflow-hidden rounded-md border border-[#E2D9D2] bg-white shadow-sm">
              <div className="relative aspect-[4/5]">
                <Image
                  src={story.image}
                  alt={t(`atelier.stories.${story.id}.imageAlt`)}
                  fill
                  unoptimized
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[2px] text-[#E2A79E]">{t(`atelier.stories.${story.id}.role`)}</p>
                <h3 className="mt-2 font-[family-name:var(--font-playfair)] text-xl font-semibold text-[#800020]">
                  {t(`atelier.stories.${story.id}.title`)}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#706565]">{t(`atelier.stories.${story.id}.story`)}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-4 rounded-md border border-[#E2D9D2] bg-[#F3ECE7] p-5 sm:grid-cols-3 sm:p-6">
          {(["checks", "years", "consulting"] as const).map((key) => (
            <div key={key} className="flex items-center gap-4">
              <HeartHandshake className="shrink-0 text-[#800020]" size={24} />
              <div>
                <p className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[#800020]">
                  {t(`atelier.metrics.${key}.value`)}
                </p>
                <p className="text-sm leading-6 text-[#706565]">{t(`atelier.metrics.${key}.label`)}</p>
              </div>
            </div>
          ))}
        </div>
      </SnapSection>

      <SnapSection id="testimonials" className="pb-24">
        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[2.5px] text-[#800020]">{t("testimonials.eyebrow")}</p>
            <h2 className="mt-2 max-w-xl font-[family-name:var(--font-playfair)] text-3xl font-semibold text-[#800020] sm:text-4xl">
              {t("testimonials.title")}
            </h2>
          </div>
          <p className="max-w-2xl text-sm leading-7 text-[#706565] sm:text-base lg:justify-self-end">{t("testimonials.description")}</p>
        </div>
        <TestimonialSlider />
      </SnapSection>
    </div>
  );
}
