"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLenis } from "lenis/react";
import { sectionIds, type SectionId } from "../types/about.types";

const HEADER_OFFSET = 96;

export function useAbout() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activeSectionId, setActiveSectionId] = useState<SectionId>("hero");
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

  const scrollToSection = useCallback(
    (id: SectionId) => {
      const section = document.getElementById(`about-${id}`);
      if (!section) return;

      const nextIndex = sectionIds.indexOf(id);
      activeIndexRef.current = nextIndex;
      setActiveSectionId(id);
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

  const scrollToIndex = useCallback(
    (nextIndex: number) => {
      const safeIndex = Math.max(0, Math.min(sectionIds.length - 1, nextIndex));
      const id = sectionIds[safeIndex];
      scrollToSection(id);
    },
    [scrollToSection]
  );

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        const rawId = visible?.target.id.replace("about-", "") as SectionId | undefined;
        if (rawId && sectionIds.includes(rawId)) {
          setActiveSectionId(rawId);
          activeIndexRef.current = sectionIds.indexOf(rawId);
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
  }, [getCurrentSectionIndex, scrollToIndex]);

  return {
    rootRef,
    activeSectionId,
    scrollToSection,
  };
}
