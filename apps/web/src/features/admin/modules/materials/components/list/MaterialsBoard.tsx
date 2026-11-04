"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Grid2x2, Layers, Rows3 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { AdminFilterSelect, AdminListPanel } from "@/features/admin/core/ui";
import { type AdminMaterialListItem } from "../../types/materials.types";
import { SEASONS, type Season } from "../../utils/materialMeta";
import { MaterialCard } from "./MaterialCard";
import { MaterialMatrix } from "./MaterialMatrix";

const CreateMaterialDialog = dynamic(() => import("./CreateMaterialDialog").then((m) => m.CreateMaterialDialog));

type View = "cards" | "matrix";
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

/** Màn chất liệu vải: lọc theo mùa / trạng thái, xem dạng thẻ vải mẫu hoặc ma trận so sánh thanh đo */
export function MaterialsBoard({ materials }: { materials: AdminMaterialListItem[] }) {
  const t = useTranslations("AdminPage.materials");
  const tPage = useTranslations("AdminPage.pages.materials");
  const [search, setSearch] = useState("");
  const [season, setSeason] = useState<"ALL" | Season>("ALL");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [view, setView] = useState<View>("cards");
  const [isCreating, setIsCreating] = useState(false);

  const keyword = search.trim().toLowerCase();
  const visible = materials.filter(
    (material) =>
      (!keyword || `${material.name} ${material.code} ${material.origin ?? ""}`.toLowerCase().includes(keyword)) &&
      (season === "ALL" || material.seasons.includes(season)) &&
      (status === "ALL" || material.isActive === (status === "ACTIVE"))
  );

  return (
    <>
      <AdminListPanel
        icon={Layers}
        title={tPage("title")}
        description={tPage("description")}
        search={{ value: search, onChange: setSearch, placeholder: t("searchPlaceholder") }}
        action={{ label: t("create.open"), onClick: () => setIsCreating(true) }}
        filters={
          <>
            <AdminFilterSelect
              label={t("filterSeason")}
              value={season}
              onChange={setSeason}
              options={[
                { value: "ALL" as const, label: t("filterAll") },
                ...SEASONS.map((value) => ({ value, label: t(`season.${value}`) })),
              ]}
              className="w-full sm:w-44"
            />
            <AdminFilterSelect
              label={t("filterStatus")}
              value={status}
              onChange={setStatus}
              options={[
                { value: "ALL" as const, label: t("filterAll") },
                { value: "ACTIVE" as const, label: t("status.active") },
                { value: "INACTIVE" as const, label: t("status.inactive") },
              ]}
              className="w-full sm:w-52"
            />
          </>
        }
      />

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-[#71717A]">{t("summary", { count: visible.length })}</p>
        <div
          role="tablist"
          aria-label={t("view.label")}
          className="inline-flex rounded-lg border border-[#E4E4E7] bg-white p-0.5 shadow-2xs"
        >
          {(
            [
              { value: "cards", icon: Grid2x2 },
              { value: "matrix", icon: Rows3 },
            ] as const
          ).map(({ value, icon: Icon }) => (
            <button
              key={value}
              type="button"
              role="tab"
              aria-selected={view === value}
              onClick={() => setView(value)}
              className={cn(
                "inline-flex h-7 cursor-pointer items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors",
                view === value ? "bg-[#18181B] text-white" : "text-[#52525B] hover:bg-[#F4F4F5]"
              )}
            >
              <Icon size={13} aria-hidden /> {t(`view.${value}`)}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-dashed border-[#E4E4E7] bg-white py-16 text-center text-sm text-[#71717A]">
          {materials.length === 0 ? t("empty") : t("noResults")}
        </p>
      ) : view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {visible.map((material) => (
            <MaterialCard key={material.id} material={material} />
          ))}
        </div>
      ) : (
        <MaterialMatrix materials={visible} />
      )}

      {isCreating && <CreateMaterialDialog onOpenChange={setIsCreating} />}
    </>
  );
}
