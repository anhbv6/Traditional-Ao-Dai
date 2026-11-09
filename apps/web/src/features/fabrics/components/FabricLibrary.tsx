"use client";

import { useMemo, useState } from "react";
import { Layers } from "lucide-react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/shared/EmptyState";
import { Reveal } from "@/components/shared/Reveal";
import { SectionOrnament } from "@/components/shared/SectionOrnament";
import { cn } from "@/lib/utils";
import type { FabricFilter, FabricMaterial } from "../types/fabrics.types";
import { availableFilters, isSameFilter, matchesFilter } from "../utils/fabricFilters";
import { FabricAlbumCard } from "./FabricAlbumCard";
import { FabricDetailDialog } from "./FabricDetailDialog";

const ALL: FabricFilter = { kind: "all" };

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "cursor-pointer whitespace-nowrap border px-4 py-2 text-xs font-semibold uppercase tracking-[1.8px] transition-colors duration-300",
        active
          ? "border-(--primary-color) bg-(--primary-color) text-white"
          : "border-(--border) text-(--text-light) hover:border-(--primary-color) hover:text-(--primary-ink)",
      )}
    >
      {children}
    </button>
  );
}

interface FabricLibraryProps {
  materials: FabricMaterial[];
}

/**
 * Album thư mục vải: bộ lọc theo mùa / sợi, lưới "ảnh dán" và trang chi tiết mở trong hộp thoại.
 * Dữ liệu lấy sẵn ở Server Component (SEO) — ở đây chỉ lọc tại chỗ.
 */
export function FabricLibrary({ materials }: FabricLibraryProps) {
  const t = useTranslations("FabricsPage");
  const [filter, setFilter] = useState<FabricFilter>(ALL);
  const [selected, setSelected] = useState<FabricMaterial | null>(null);
  const [open, setOpen] = useState(false);

  const filters = useMemo(() => availableFilters(materials), [materials]);
  const visible = materials.filter((material) => matchesFilter(material, filter));

  const openMaterial = (material: FabricMaterial) => {
    setSelected(material);
    setOpen(true);
  };

  return (
    <div>
      {/* Bộ lọc: theo mùa mặc, theo sợi dệt */}
      <Reveal className="mb-12 space-y-4 border-y border-(--border) py-5 sm:mb-16">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <p className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-[2.5px] text-(--text-light)">{t("filters.season")}</p>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <FilterChip active={filter.kind === "all"} onClick={() => setFilter(ALL)}>
              {t("filters.all")}
            </FilterChip>
            {filters.seasons.map((season) => {
              const value: FabricFilter = { kind: "season", value: season };
              return (
                <FilterChip key={season} active={isSameFilter(filter, value)} onClick={() => setFilter(value)}>
                  {t(`season.${season}`)}
                </FilterChip>
              );
            })}
          </div>
        </div>
        {filters.fibers.length > 1 ? (
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <p className="w-28 shrink-0 text-[11px] font-semibold uppercase tracking-[2.5px] text-(--text-light)">{t("filters.fiber")}</p>
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {filters.fibers.map((fiber) => {
                const value: FabricFilter = { kind: "fiber", value: fiber };
                return (
                  <FilterChip key={fiber} active={isSameFilter(filter, value)} onClick={() => setFilter(value)}>
                    {t(`fiber.${fiber}`)}
                  </FilterChip>
                );
              })}
            </div>
          </div>
        ) : null}
      </Reveal>

      <div className="mb-10 flex items-center gap-4">
        <p className="shrink-0 font-[family-name:var(--font-dancing)] text-2xl text-(--primary-ink)">
          {t("count", { count: visible.length })}
        </p>
        <SectionOrnament fullWidth />
      </div>

      {visible.length > 0 ? (
        // key theo bộ lọc → đổi bộ lọc thì các tấm ảnh hiện dần lại
        <ul key={JSON.stringify(filter)} className="grid gap-x-8 gap-y-14 pt-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((material, index) => (
            <li key={material.code}>
              <Reveal delay={(index % 4) * 0.08}>
                <FabricAlbumCard material={material} index={index} onOpen={() => openMaterial(material)} />
              </Reveal>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          icon={Layers}
          title={t("empty.filteredTitle")}
          description={t("empty.filteredDescription")}
          action={t("filters.all")}
          onAction={() => setFilter(ALL)}
        />
      )}

      <FabricDetailDialog material={selected} open={open} onOpenChange={setOpen} onClosed={() => setSelected(null)} />
    </div>
  );
}
