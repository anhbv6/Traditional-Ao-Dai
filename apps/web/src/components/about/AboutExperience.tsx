"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useLenis } from "lenis/react";
import { motion } from "motion/react";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
  Ruler,
  Scissors,
  Sparkles,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FitProfile = {
  id: "slender" | "curvy";
  image: string;
};

type Story = {
  id: "founder" | "tailor" | "cutting";
  image: string;
};

type Testimonial = {
  id: "wedding" | "graduation" | "tet" | "engagement";
  image: string;
};

const sectionIds = ["hero", "pain-solution", "fit-model", "atelier", "testimonials"] as const;
const HEADER_OFFSET = 96;

const fitProfiles: FitProfile[] = [
  {
    id: "slender",
    image: "https://cdn.pixabay.com/photo/2022/05/22/16/35/vietnamese-woman-7213859_1280.jpg",
  },
  {
    id: "curvy",
    image: "https://cdn.pixabay.com/photo/2022/07/15/03/42/vietnamese-woman-7322247_1280.jpg",
  },
];

const atelierStories: Story[] = [
  {
    id: "founder",
    image: "https://cdn.pixabay.com/photo/2022/08/26/12/13/vietnamese-woman-7412407_1280.jpg",
  },
  {
    id: "tailor",
    image: "https://cdn.pixabay.com/photo/2021/04/16/07/22/ao-dai-6182834_1280.jpg",
  },
  {
    id: "cutting",
    image: "https://cdn.pixabay.com/photo/2016/11/29/05/08/adult-1868750_1280.jpg",
  },
];

const testimonials: Testimonial[] = [
  {
    id: "wedding",
    image: "https://cdn.pixabay.com/photo/2021/04/16/07/22/ao-dai-6182834_1280.jpg",
  },
  {
    id: "graduation",
    image: "https://cdn.pixabay.com/photo/2022/07/15/03/42/vietnamese-woman-7322247_1280.jpg",
  },
  {
    id: "tet",
    image: "https://cdn.pixabay.com/photo/2022/05/22/16/35/vietnamese-woman-7213859_1280.jpg",
  },
  {
    id: "engagement",
    image: "https://cdn.pixabay.com/photo/2022/08/26/12/13/vietnamese-woman-7412407_1280.jpg",
  },
];

function SnapSection({
  id,
  children,
  className,
}: {
  id: (typeof sectionIds)[number];
  children: ReactNode;
  className?: string;
}) {
  const isLastSection = id === "testimonials";

  return (
    <motion.section
      id={`about-${id}`}
      data-about-snap-section
      initial={{ opacity: 0, y: 34 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.45 }}
      transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative flex scroll-mt-24 items-center py-10 sm:py-12 lg:py-14",
        isLastSection ? "min-h-[calc(100svh-96px)]" : "h-[calc(100svh-96px)] overflow-hidden",
        className
      )}
    >
      <div className="w-full">{children}</div>
    </motion.section>
  );
}

function useSectionSnap(rootRef: React.RefObject<HTMLDivElement | null>) {
  const lenis = useLenis();
  const activeIndexRef = useRef(0);
  const lockRef = useRef(false);
  const touchStartYRef = useRef<number | null>(null);

  const getCurrentSectionIndex = useCallback(() => {
    let nearestIndex = activeIndexRef.current;
    let nearestDistance = Number.POSITIVE_INFINITY;

    sectionIds.forEach((id, index) => {
      const section = document.getElementById(`about-${id}`);
      if (!section) return;

      const rect = section.getBoundingClientRect();
      const distance = Math.abs(rect.top - HEADER_OFFSET);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    activeIndexRef.current = nearestIndex;
    return nearestIndex;
  }, []);

  const scrollToIndex = useCallback(
    (nextIndex: number) => {
      const safeIndex = Math.max(0, Math.min(sectionIds.length - 1, nextIndex));
      const id = sectionIds[safeIndex];
      const section = document.getElementById(`about-${id}`);

      if (!section) return;

      activeIndexRef.current = safeIndex;
      lockRef.current = true;

      if (lenis) {
        lenis.scrollTo(section, { duration: 1.12, offset: -HEADER_OFFSET, easing: (t) => 1 - Math.pow(1 - t, 3) });
      } else {
        section.scrollIntoView({ behavior: "smooth", block: "start" });
      }

      window.setTimeout(() => {
        lockRef.current = false;
      }, 1160);
    },
    [lenis]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        const rawId = visible?.target.id.replace("about-", "") as (typeof sectionIds)[number] | undefined;
        const nextIndex = rawId ? sectionIds.findIndex((id) => id === rawId) : -1;

        if (rawId && nextIndex >= 0) {
          activeIndexRef.current = nextIndex;
        }
      },
      { rootMargin: "-42% 0px -42% 0px", threshold: [0.2, 0.45, 0.7] }
    );

    sectionIds.forEach((id) => {
      const section = document.getElementById(`about-${id}`);
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const handleWheel = (event: WheelEvent) => {
      if (!root.contains(event.target as Node)) return;

      const delta = event.deltaY;
      if (Math.abs(delta) < 18) return;

      if (lockRef.current) return;

      const currentIndex = getCurrentSectionIndex();
      const nextIndex = currentIndex + (delta > 0 ? 1 : -1);

      if (nextIndex < 0 || nextIndex >= sectionIds.length) return;

      event.preventDefault();
      scrollToIndex(nextIndex);
    };

    const handleTouchStart = (event: TouchEvent) => {
      if (!root.contains(event.target as Node)) return;

      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!root.contains(event.target as Node)) return;

      const startY = touchStartYRef.current;
      const currentY = event.touches[0]?.clientY;

      if (startY === null || currentY === undefined) return;

      const delta = startY - currentY;
      if (Math.abs(delta) < 42) return;

      if (!lockRef.current) {
        const currentIndex = getCurrentSectionIndex();
        const nextIndex = currentIndex + (delta > 0 ? 1 : -1);

        if (nextIndex < 0 || nextIndex >= sectionIds.length) return;

        event.preventDefault();
        scrollToIndex(nextIndex);
      }

      touchStartYRef.current = currentY;
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [getCurrentSectionIndex, rootRef, scrollToIndex]);
}

function FitModel() {
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

function TestimonialSlider() {
  const t = useTranslations("AboutPage.testimonials");
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const updateSelected = useCallback(() => {
    if (emblaApi) {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    }
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;

    emblaApi.on("select", updateSelected);
    emblaApi.on("reInit", updateSelected);

    return () => {
      emblaApi.off("select", updateSelected);
      emblaApi.off("reInit", updateSelected);
    };
  }, [emblaApi, updateSelected]);

  return (
    <div className="mt-6">
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          aria-label={t("previous")}
          onClick={() => emblaApi?.scrollPrev()}
          className="grid size-10 cursor-pointer place-items-center rounded-md border border-[#800020]/15 bg-white text-[#800020] transition-colors hover:bg-[#800020] hover:text-white"
        >
          <ChevronLeft size={18} />
        </button>
        <button
          type="button"
          aria-label={t("next")}
          onClick={() => emblaApi?.scrollNext()}
          className="grid size-10 cursor-pointer place-items-center rounded-md border border-[#800020]/15 bg-white text-[#800020] transition-colors hover:bg-[#800020] hover:text-white"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="mt-4 overflow-hidden" ref={emblaRef}>
        <div className="-ml-4 flex touch-pan-y">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="min-w-0 flex-[0_0_86%] pl-4 sm:flex-[0_0_48%] lg:flex-[0_0_32%]">
              <article className="h-full overflow-hidden rounded-md border border-[#E2D9D2] bg-white shadow-sm">
                <div className="relative aspect-[4/5]">
                  <Image
                    src={testimonial.image}
                    alt={t(`items.${testimonial.id}.imageAlt`)}
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 86vw, (max-width: 1024px) 48vw, 32vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#2A2525]/50 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 rounded-md bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[1.8px] text-[#800020] shadow-sm">
                    {t("customerPhoto")}
                  </div>
                </div>
                <div className="p-5">
                  <div className="flex gap-1 text-[#E2A79E]">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star key={index} size={14} fill="currentColor" stroke="none" />
                    ))}
                  </div>
                  <p className="mt-4 text-sm italic leading-7 text-[#2A2525]">&quot;{t(`items.${testimonial.id}.quote`)}&quot;</p>
                  <div className="mt-5 border-t border-[#E2D9D2] pt-4">
                    <h3 className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[#800020]">
                      {t(`items.${testimonial.id}.name`)}
                    </h3>
                    <p className="text-xs uppercase tracking-[2px] text-[#706565]">{t(`items.${testimonial.id}.occasion`)}</p>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-2">
        {testimonials.map((testimonial, index) => (
          <button
            key={testimonial.id}
            type="button"
            aria-label={t("goTo", { index: index + 1 })}
            onClick={() => emblaApi?.scrollTo(index)}
            className={cn(
              "h-1.5 cursor-pointer rounded-full transition-all",
              selectedIndex === index ? "w-6 bg-[#800020]" : "w-1.5 bg-[#E2A79E]/45 hover:bg-[#E2A79E]"
            )}
          />
        ))}
      </div>
    </div>
  );
}

export function AboutExperience() {
  const t = useTranslations("AboutPage");
  const rootRef = useRef<HTMLDivElement>(null);
  useSectionSnap(rootRef);

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
