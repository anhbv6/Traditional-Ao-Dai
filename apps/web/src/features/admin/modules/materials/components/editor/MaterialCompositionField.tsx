"use client";

import { useState } from "react";
import { Minus, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { type CompositionItem } from "../../types/materials.types";
import {
  COMPOSITION_SHADES,
  FIBERS,
  MAX_COMPOSITION_ITEMS,
  compositionTotal,
  type Fiber,
} from "../../utils/materialMeta";
import { CompositionBar } from "../shared/CompositionBar";

/** Các tỉ lệ vải truyền thống phổ biến giúp chọn nhanh một chạm */
const COMPOSITION_PRESETS: { label: string; items: CompositionItem[] }[] = [
  { label: "100% Tơ tằm", items: [{ fiber: "SILK", percent: 100 }] },
  { label: "100% Lanh / Đũi", items: [{ fiber: "LINEN", percent: 100 }] },
  { label: "100% Bông", items: [{ fiber: "COTTON", percent: 100 }] },
  {
    label: "95% Tơ · 5% Spandex",
    items: [
      { fiber: "SILK", percent: 95 },
      { fiber: "SPANDEX", percent: 5 },
    ],
  },
  {
    label: "70% Tơ · 30% Bông",
    items: [
      { fiber: "SILK", percent: 70 },
      { fiber: "COTTON", percent: 30 },
    ],
  },
  {
    label: "80% Lanh · 20% Bông",
    items: [
      { fiber: "LINEN", percent: 80 },
      { fiber: "COTTON", percent: 20 },
    ],
  },
];

/**
 * Thành phần sợi tiên tiến:
 * - Gợi ý tỉ lệ nhanh một chạm (Presets).
 * - Chọn thêm sợi trực tiếp từ dải tag (Pills) thay vì mở dropdown lắt nhắt.
 * - Bộ điều khiển % mượt mà, gõ số không bị kẹt clamp vội.
 * - Tính năng bù thông minh: bù vào sợi chính hoặc bấm nút bù trực tiếp vào từng sợi.
 * - Font chữ, kích thước và màu sắc đồng bộ chuẩn thiết kế Thiên Canh.
 */
export function MaterialCompositionField({
  items,
  onChange,
}: {
  items: CompositionItem[];
  onChange: (items: CompositionItem[]) => void;
}) {
  const t = useTranslations("AdminPage.materials");
  const total = compositionTotal(items);
  const used = new Set(items.map((item) => item.fiber));
  const availableFibers = FIBERS.filter((fiber) => !used.has(fiber));

  // State đệm cho giá trị nhập đang gõ (để không bị ép số khi người dùng xóa hết)
  const [draftPercents, setDraftPercents] = useState<Record<string, string>>({});

  const handlePercentChange = (fiber: Fiber, rawValue: string) => {
    setDraftPercents((prev) => ({ ...prev, [fiber]: rawValue }));
    if (rawValue.trim() === "") return;
    const num = Number(rawValue);
    if (!Number.isNaN(num) && num >= 0 && num <= 100) {
      onChange(items.map((item) => (item.fiber === fiber ? { ...item, percent: Math.round(num) } : item)));
    }
  };

  const handlePercentBlur = (fiber: Fiber) => {
    const draft = draftPercents[fiber];
    if (draft !== undefined) {
      const num = Number(draft);
      const safe = Number.isNaN(num) || num <= 0 ? 1 : Math.min(100, Math.round(num));
      onChange(items.map((item) => (item.fiber === fiber ? { ...item, percent: safe } : item)));
      setDraftPercents((prev) => {
        const next = { ...prev };
        delete next[fiber];
        return next;
      });
    }
  };

  const stepPercent = (index: number, delta: number) => {
    const item = items[index];
    const target = item.percent + delta;
    const safe = Math.max(1, Math.min(100, target));
    onChange(items.map((it, i) => (i === index ? { ...it, percent: safe } : it)));
  };

  const removeFiber = (fiber: Fiber) => {
    onChange(items.filter((item) => item.fiber !== fiber));
  };

  const addFiber = (fiber: Fiber) => {
    if (items.length >= MAX_COMPOSITION_ITEMS) return;
    const remaining = 100 - total;
    const defaultPercent = remaining > 0 ? remaining : 5;
    onChange([...items, { fiber, percent: defaultPercent }]);
  };

  /** Bù số % còn thiếu vào một sợi chỉ định */
  const balanceIntoFiber = (targetFiber: Fiber) => {
    const diff = 100 - total;
    if (diff === 0) return;
    onChange(
      items.map((item) => {
        if (item.fiber === targetFiber) {
          return { ...item, percent: Math.max(1, item.percent + diff) };
        }
        return item;
      })
    );
  };

  /** Tự động bù vào sợi chủ đạo (chiếm tỷ trọng lớn nhất) */
  const autoBalanceMainFiber = () => {
    if (items.length === 0) return;
    const diff = 100 - total;
    if (diff === 0) return;
    // Tìm sợi có tỷ trọng cao nhất
    let maxItem = items[0];
    for (const item of items) {
      if (item.percent > maxItem.percent) {
        maxItem = item;
      }
    }
    balanceIntoFiber(maxItem.fiber);
  };

  return (
    <div className="space-y-3">
      {/* 1. Gợi ý nhanh (Presets) */}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-xs text-[#71717A]">{t("composition.quickPresets")}</span>
        {COMPOSITION_PRESETS.map((preset) => {
          const isActive =
            items.length === preset.items.length &&
            preset.items.every((p) => items.some((it) => it.fiber === p.fiber && it.percent === p.percent));
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => onChange(preset.items)}
              className={cn(
                "h-6.5 cursor-pointer rounded-md px-2 text-xs font-medium transition-colors",
                isActive
                  ? "bg-[#18181B] text-white"
                  : "border border-[#E4E4E7] bg-white text-[#3F3F46] hover:border-[#18181B] hover:text-[#09090B]"
              )}
            >
              {preset.label}
            </button>
          );
        })}
      </div>

      {/* 2. Danh sách các sợi đã chọn */}
      {items.length > 0 && (
        <div className="space-y-2 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-3">
          <div className="space-y-2">
            {items.map((item, index) => {
              const shadeClass = COMPOSITION_SHADES[index % COMPOSITION_SHADES.length];
              const displayVal = draftPercents[item.fiber] ?? String(item.percent);
              const remaining = 100 - total;

              return (
                <div
                  key={item.fiber}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[#E4E4E7] bg-white px-3 py-2 shadow-2xs"
                >
                  {/* Tên sợi kèm chấm màu */}
                  <div className="flex min-w-0 items-center gap-2">
                    <span className={cn("size-2 shrink-0 rounded-full", shadeClass)} />
                    <span className="truncate text-sm font-medium text-[#09090B]">
                      {t(`fiber.${item.fiber}`)}
                    </span>
                  </div>

                  {/* Nút bù nhanh vào sợi này (nếu đang thiếu và có > 1 sợi) */}
                  <div className="flex items-center gap-2">
                    {remaining > 0 && items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => balanceIntoFiber(item.fiber)}
                        title={`Bù ${remaining}% còn thiếu vào sợi ${t(`fiber.${item.fiber}`)}`}
                        className="cursor-pointer rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 font-mono text-2xs font-medium text-emerald-800 hover:bg-emerald-100"
                      >
                        +{remaining}%
                      </button>
                    )}

                    {/* Bộ điều khiển Stepper */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={item.percent <= 1}
                        onClick={() => stepPercent(index, -5)}
                        aria-label="Giảm 5%"
                        className="grid size-7 cursor-pointer place-items-center rounded text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B] disabled:pointer-events-none disabled:opacity-30"
                      >
                        <Minus size={13} />
                      </button>

                      <div className="relative">
                        <input
                          type="text"
                          inputMode="numeric"
                          value={displayVal}
                          onChange={(e) => handlePercentChange(item.fiber, e.target.value)}
                          onBlur={() => handlePercentBlur(item.fiber)}
                          className="h-7 w-13 rounded border border-[#E4E4E7] bg-white px-1 pr-3.5 text-right font-mono text-xs font-semibold tabular-nums text-[#09090B] focus:border-[#18181B] focus:outline-none"
                        />
                        <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-2xs text-[#71717A]">
                          %
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={item.percent >= 100}
                        onClick={() => stepPercent(index, 5)}
                        aria-label="Tăng 5%"
                        className="grid size-7 cursor-pointer place-items-center rounded text-[#71717A] hover:bg-[#F4F4F5] hover:text-[#09090B] disabled:pointer-events-none disabled:opacity-30"
                      >
                        <Plus size={13} />
                      </button>

                      <button
                        type="button"
                        onClick={() => removeFiber(item.fiber)}
                        aria-label={t("composition.remove")}
                        className="ml-1 grid size-7 cursor-pointer place-items-center rounded text-[#71717A] transition-colors hover:bg-rose-50 hover:text-rose-600"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Thanh phân bổ tỉ lệ trực quan */}
          <div className="pt-1">
            <CompositionBar items={items} showLabel={false} />
          </div>

          {/* Dòng tổng kết tỉ lệ */}
          <div className="flex items-center justify-between pt-1 text-xs">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "font-mono font-medium tabular-nums",
                  total === 100
                    ? "text-emerald-700"
                    : total < 100
                      ? "text-amber-700"
                      : "text-rose-600"
                )}
              >
                {t("composition.total", { total })}
              </span>
              {total < 100 && (
                <span className="font-sans text-xs text-amber-700">
                  (còn thiếu {100 - total}%)
                </span>
              )}
              {total > 100 && (
                <span className="font-sans text-xs text-rose-600">
                  (vượt quá {total - 100}%)
                </span>
              )}
            </div>

            {total !== 100 && (
              <button
                type="button"
                onClick={autoBalanceMainFiber}
                className="cursor-pointer font-medium text-emerald-800 hover:underline"
              >
                {t("composition.autoBalance")}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. Dải tag chọn thêm sợi (Fibers selector pills) */}
      {availableFibers.length > 0 && items.length < MAX_COMPOSITION_ITEMS && (
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-xs text-[#71717A]">{t("composition.addMore")}</span>
          {availableFibers.map((fiber) => (
            <button
              key={fiber}
              type="button"
              onClick={() => addFiber(fiber)}
              className="inline-flex h-6.5 cursor-pointer items-center gap-1 rounded-md border border-dashed border-[#D4D4D8] bg-white px-2 text-xs font-medium text-[#52525B] transition-colors hover:border-[#18181B] hover:text-[#09090B]"
            >
              <Plus size={11} aria-hidden />
              <span>{t(`fiber.${fiber}`)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
