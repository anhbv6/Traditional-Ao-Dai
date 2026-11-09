"use client";

import { Images } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { AVAILABILITY_DOT } from "../constants/fabricMeta";
import type { FabricMaterial } from "../types/fabrics.types";
import { FabricCover } from "./FabricCover";

/** Nghiêng nhẹ xen kẽ như ảnh dán album; rê chuột thì thẳng lại */
const TILTS = ["-rotate-[1.2deg]", "rotate-[0.8deg]", "-rotate-[0.4deg]", "rotate-[1.4deg]"];

interface FabricAlbumCardProps {
  material: FabricMaterial;
  index: number;
  onOpen: () => void;
}

/** Một "tấm ảnh" trong album: khung giấy trắng, băng dính giấy, chú thích viết tay bên dưới */
export function FabricAlbumCard({ material, index, onOpen }: FabricAlbumCardProps) {
  const t = useTranslations("FabricsPage");
  const photoCount = material.closeupImages.length + (material.videoUrl ? 1 : 0);

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-haspopup="dialog"
      aria-label={t("card.open", { name: material.name })}
      className={cn(
        "group relative block w-full cursor-pointer bg-(--bg-card) p-3 pb-5 text-left shadow-[0_18px_40px_-24px_color-mix(in_oklab,var(--overlay)_45%,transparent)] ring-1 ring-(--border)",
        "transition-[rotate,translate,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:rotate-0 hover:shadow-[0_28px_60px_-28px_color-mix(in_oklab,var(--overlay)_55%,transparent)]",
        "focus-visible:rotate-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--ring)",
        TILTS[index % TILTS.length],
      )}
    >
      {/* Băng dính giấy giữ ảnh vào trang album */}
      <span
        aria-hidden="true"
        className="absolute -top-2.5 left-1/2 z-10 h-5 w-20 -translate-x-1/2 -rotate-2 bg-(--accent-color)/45 shadow-sm backdrop-blur-[1px]"
      />

      <div className="relative">
        <FabricCover material={material} sizes="(min-width: 1280px) 22vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw" className="aspect-[4/5]" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-3 border border-white/0 transition-colors duration-700 group-hover:border-white/60" />
        {photoCount > 1 ? (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-(--bg-card)/90 px-2 py-1 text-[11px] font-semibold text-(--text-main)">
            <Images size={13} strokeWidth={1.6} />
            {photoCount}
          </span>
        ) : null}
      </div>

      <div className="mt-4 px-1">
        <p className="font-[family-name:var(--font-dancing)] text-lg leading-none text-(--accent-color)">
          {material.origin ?? t("card.originUnknown")}
        </p>
        <h3 className="mt-1.5 font-[family-name:var(--font-playfair)] text-xl font-semibold leading-snug text-(--primary-ink) decoration-(--accent-color) decoration-1 underline-offset-4 group-hover:underline">
          {material.name}
        </h3>
        <p className="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-[1.8px] text-(--text-light)">
          <span aria-hidden="true" className={cn("size-1.5 rotate-45", AVAILABILITY_DOT[material.availability])} />
          {t(`availability.${material.availability}`)}
        </p>
      </div>
    </button>
  );
}
