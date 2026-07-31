"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { useTranslations } from "next-intl";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { testimonials } from "../types/about.types";

export function TestimonialSlider() {
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
