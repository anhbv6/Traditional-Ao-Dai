"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform, useVelocity } from "motion/react";
import { useFormatter, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useTodayTodos } from "../hooks/useTodayTodos";
import { AdminMiniCalendar } from "./AdminMiniCalendar";

// Độ lệch tối đa (px) khi cuộn nhanh và lò xo mềm, hơi thiếu giảm chấn để thẻ trượt lố rồi từ từ quay về
const DRIFT_MAX = 36;
const DRIFT_SPRING = { stiffness: 70, damping: 11, mass: 1.2 };

/**
 * Thẻ lịch tháng + việc cần làm hôm nay (ngay dưới khối tài khoản trong AdminRightRail), chiều cao cố định
 * (danh sách dài thì cuộn bên trong). Khi trang cuộn, thẻ trôi trễ theo quán tính rồi bật về chỗ cũ.
 */
export function AdminTodayNotes() {
  const t = useTranslations("AdminPage.todayNotes");
  const format = useFormatter();
  const { items, add, toggle, remove, clearDone } = useTodayTodos();
  const [draft, setDraft] = useState("");
  const doneCount = items.filter((item) => item.done).length;

  // Vận tốc cuộn trang -> độ lệch ngược chiều (thẻ "bị kéo theo" nội dung), qua lò xo để có độ lố và êm
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  const scrollVelocity = useVelocity(scrollY);
  const drift = useTransform(scrollVelocity, [-2500, 0, 2500], [DRIFT_MAX, 0, -DRIFT_MAX], { clamp: true });
  const y = useSpring(drift, DRIFT_SPRING);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    add(draft);
    setDraft("");
  };

  return (
    <motion.section
      style={{ y: reduceMotion ? 0 : y }}
      className="flex h-[600px] max-h-full w-full flex-col rounded-2xl border border-[#E4E4E7] bg-white shadow-[0_12px_32px_-20px_rgba(9,9,11,0.18)] will-change-transform"
    >
      <AdminMiniCalendar />

      <div aria-hidden className="mx-4 border-t border-dashed border-[#E4E4E7]" />

      {/* Phần việc hôm nay nối ngay dưới lịch, cùng một thẻ */}
      <header className="flex items-baseline gap-2 px-4 pt-3">
        <h2 className="text-sm font-semibold text-[#09090B]">{t("title")}</h2>
        <p className="min-w-0 flex-1 truncate text-xs capitalize text-[#71717A]">
          {format.dateTime(new Date(), { weekday: "long", day: "numeric", month: "numeric" })}
        </p>
        {items.length > 0 && (
          <span className="font-mono text-xs font-semibold tabular-nums text-[#71717A]">
            {doneCount}/{items.length}
          </span>
        )}
      </header>

      <form onSubmit={handleSubmit} className="flex gap-2 px-4 pt-2.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={200}
          aria-label={t("placeholder")}
          placeholder={t("placeholder")}
          className="h-9 min-w-0 flex-1 rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm text-[#09090B] outline-none placeholder:text-[#A1A1AA] focus:border-[#18181B]"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="h-9 shrink-0 cursor-pointer rounded-lg border border-[#E4E4E7] bg-white px-3 text-sm font-medium text-[#09090B] transition-colors hover:bg-[#FAFAFA] disabled:cursor-not-allowed disabled:text-[#A1A1AA]"
        >
          {t("add")}
        </button>
      </form>

      {items.length === 0 ? (
        <p className="grid flex-1 place-items-center px-6 text-center text-xs text-[#A1A1AA]">{t("empty")}</p>
      ) : (
        <ul className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
          {items.map((item) => (
            <li key={item.id} className="group flex items-start gap-2.5 rounded-lg px-2 py-1.5 hover:bg-[#F4F4F5]">
              <button
                type="button"
                role="checkbox"
                aria-checked={item.done}
                aria-label={item.text}
                onClick={() => toggle(item.id)}
                className={cn(
                  "mt-0.5 grid size-4 shrink-0 cursor-pointer place-items-center rounded border transition-colors",
                  item.done
                    ? "border-[#18181B] bg-[#18181B] text-white"
                    : "border-[#D4D4D8] bg-white hover:border-[#71717A]"
                )}
              >
                {item.done && <Check size={12} strokeWidth={3} aria-hidden />}
              </button>
              <span
                className={cn(
                  "min-w-0 flex-1 break-words text-sm leading-5",
                  item.done ? "text-[#A1A1AA] line-through" : "text-[#09090B]"
                )}
              >
                {item.text}
              </span>
              <button
                type="button"
                onClick={() => remove(item.id)}
                aria-label={t("remove")}
                className="mt-0.5 shrink-0 cursor-pointer rounded text-[#A1A1AA] opacity-0 transition-opacity hover:text-[#09090B] focus-visible:opacity-100 group-hover:opacity-100"
              >
                <X size={14} aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      {doneCount > 0 && (
        <div className="border-t border-[#E4E4E7] px-4 py-2.5">
          <button
            type="button"
            onClick={clearDone}
            className="cursor-pointer text-xs font-medium text-[#71717A] hover:text-[#09090B]"
          >
            {t("clearDone", { count: doneCount })}
          </button>
        </div>
      )}
    </motion.section>
  );
}
