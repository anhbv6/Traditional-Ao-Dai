"use client";

import { Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { AdminFilterSelect } from "@/features/admin/core/ui";
import { type CompositionItem } from "../../types/materials.types";
import { FIBERS, MAX_COMPOSITION_ITEMS, compositionTotal, type Fiber } from "../../utils/materialMeta";
import { CompositionBar } from "../shared/CompositionBar";

/** Thành phần sợi: từng dòng sợi + %, thanh xếp chồng xem trước và tổng phải đủ 100% */
export function MaterialCompositionField({
  items,
  onChange,
  inputClassName,
}: {
  items: CompositionItem[];
  onChange: (items: CompositionItem[]) => void;
  inputClassName: string;
}) {
  const t = useTranslations("AdminPage.materials");
  const total = compositionTotal(items);
  const used = new Set(items.map((item) => item.fiber));
  const nextFiber = FIBERS.find((fiber) => !used.has(fiber));

  const update = (index: number, patch: Partial<CompositionItem>) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <div className="space-y-3">
      {items.length > 0 && (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={item.fiber} className="flex items-center gap-2">
              <AdminFilterSelect
                label={t("composition.fiber")}
                value={item.fiber}
                // Mỗi sợi chỉ một dòng — ẩn các sợi đã có ở dòng khác
                options={FIBERS.filter((fiber) => fiber === item.fiber || !used.has(fiber)).map((fiber) => ({
                  value: fiber,
                  label: t(`fiber.${fiber}`),
                }))}
                onChange={(fiber: Fiber) => update(index, { fiber })}
                className="h-10 min-w-0 flex-1"
              />
              <div className="relative w-24 shrink-0">
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={item.percent}
                  onChange={(e) => update(index, { percent: Math.max(0, Math.min(100, Math.round(Number(e.target.value)))) })}
                  aria-label={t("composition.percent")}
                  className={cn(inputClassName, "pr-7 text-right font-mono tabular-nums")}
                />
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#A1A1AA]">%</span>
              </div>
              <button
                type="button"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                aria-label={t("composition.remove")}
                className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-md text-[#A1A1AA] hover:bg-[#F4F4F5] hover:text-rose-600"
              >
                <X size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {nextFiber && items.length < MAX_COMPOSITION_ITEMS && (
          <button
            type="button"
            onClick={() =>
              onChange([...items, { fiber: nextFiber, percent: Math.max(1, Math.min(100, 100 - total)) || 100 }])
            }
            className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-dashed border-[#D4D4D8] px-2.5 text-xs font-medium text-[#52525B] hover:border-[#A1A1AA] hover:text-[#09090B]"
          >
            <Plus size={13} aria-hidden /> {t("composition.add")}
          </button>
        )}
        {items.length > 0 && (
          <span
            className={cn(
              "ml-auto font-mono text-xs font-semibold tabular-nums",
              total === 100 ? "text-emerald-700" : "text-amber-700"
            )}
          >
            {t("composition.total", { total })}
          </span>
        )}
      </div>
      {items.length > 0 && <CompositionBar items={items} showLabel={false} />}
    </div>
  );
}
