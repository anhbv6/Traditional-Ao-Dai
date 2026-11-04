"use client";

import { ArrowDown, ArrowUp, Plus, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { type ProcessStep } from "../../types/materials.types";
import { MAX_PROCESS_STEPS } from "../../utils/materialMeta";

/** Tên trường theo ngôn ngữ nội dung đang chọn */
const STEP_FIELDS = {
  vi: { title: "title", detail: "detail" },
  en: { title: "titleEn", detail: "detailEn" },
} as const;

/**
 * Quy trình làm ra tấm vải (trồng dâu → ươm tơ → dệt → nhuộm...) dạng dòng thời gian đánh số —
 * câu chuyện kể cho khách ở trang sản phẩm
 */
export function MaterialProcessField({
  steps,
  onChange,
  lang,
  inputClassName,
}: {
  steps: ProcessStep[];
  onChange: (steps: ProcessStep[]) => void;
  lang: "vi" | "en";
  inputClassName: string;
}) {
  const t = useTranslations("AdminPage.materials");
  const fields = STEP_FIELDS[lang];

  const update = (index: number, patch: Partial<ProcessStep>) =>
    onChange(steps.map((step, i) => (i === index ? { ...step, ...patch } : step)));
  const move = (index: number, direction: -1 | 1) => {
    const next = [...steps];
    const [item] = next.splice(index, 1);
    next.splice(index + direction, 0, item);
    onChange(next);
  };

  return (
    <div>
      {steps.length === 0 ? (
        <p className="rounded-lg border border-dashed border-[#E4E4E7] px-4 py-6 text-center text-xs text-[#71717A]">
          {t("process.empty")}
        </p>
      ) : (
        <ol className="relative space-y-3">
          {/* Trục dọc nối các bước */}
          <span aria-hidden className="absolute bottom-4 left-[13px] top-4 w-px bg-[#E4E4E7]" />
          {steps.map((step, index) => (
            <li key={index} className="relative flex gap-3">
              <span className="relative z-10 grid size-7 shrink-0 place-items-center rounded-full border border-[#18181B] bg-white font-mono text-xs font-semibold text-[#09090B]">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1 space-y-2 rounded-lg border border-[#E4E4E7] p-3">
                <div className="flex items-center gap-2">
                  <input
                    value={step[fields.title]}
                    onChange={(e) => update(index, { [fields.title]: e.target.value })}
                    placeholder={t(`placeholders.${lang}.stepTitle`)}
                    aria-invalid={lang === "vi" && !step.title.trim()}
                    className={cn(inputClassName, "h-9 font-medium aria-invalid:border-amber-400")}
                  />
                  <div className="flex shrink-0">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                      aria-label={t("process.moveUp")}
                      className="grid size-8 cursor-pointer place-items-center rounded-md text-[#71717A] hover:bg-[#F4F4F5] disabled:cursor-default disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      type="button"
                      disabled={index === steps.length - 1}
                      onClick={() => move(index, 1)}
                      aria-label={t("process.moveDown")}
                      className="grid size-8 cursor-pointer place-items-center rounded-md text-[#71717A] hover:bg-[#F4F4F5] disabled:cursor-default disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onChange(steps.filter((_, i) => i !== index))}
                      aria-label={t("process.remove")}
                      className="grid size-8 cursor-pointer place-items-center rounded-md text-[#A1A1AA] hover:bg-[#F4F4F5] hover:text-rose-600"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <textarea
                  value={step[fields.detail]}
                  onChange={(e) => update(index, { [fields.detail]: e.target.value })}
                  rows={2}
                  placeholder={t(`placeholders.${lang}.stepDetail`)}
                  className={cn(inputClassName, "h-auto resize-y py-2")}
                />
              </div>
            </li>
          ))}
        </ol>
      )}
      {steps.length < MAX_PROCESS_STEPS && (
        <button
          type="button"
          onClick={() => onChange([...steps, { title: "", titleEn: "", detail: "", detailEn: "" }])}
          className="mt-3 inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-dashed border-[#D4D4D8] px-2.5 text-xs font-medium text-[#52525B] hover:border-[#A1A1AA] hover:text-[#09090B]"
        >
          <Plus size={13} aria-hidden /> {t("process.add")}
        </button>
      )}
    </div>
  );
}
