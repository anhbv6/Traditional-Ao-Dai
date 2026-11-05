"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { motion } from "motion/react";
import { ArrowUp, RotateCcw, Sparkles, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { ASSISTANT_SUGGESTIONS, pickAssistantReply } from "../data/assistantMock";
import { useAssistantStore } from "../store/assistantStore";
import { AdminTooltip } from "../../ui";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Khung chat trợ lý AI khu quản trị.
 * - Điện thoại (< sm): phủ toàn màn hình (`100dvh` để không bị thanh địa chỉ che).
 * - iPad / desktop: thẻ nổi góc dưới phải, rộng 400px, cao tối đa 640px.
 */
export function AdminAssistantPanel() {
  const t = useTranslations("AdminPage.assistant");
  const locale = useLocale();
  const messages = useAssistantStore((state) => state.messages);
  const isTyping = useAssistantStore((state) => state.isTyping);
  const close = useAssistantStore((state) => state.close);
  const send = useAssistantStore((state) => state.send);
  const reset = useAssistantStore((state) => state.reset);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Cuộn xuống tin mới nhất (thao tác DOM, không đổi state)
  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, isTyping]);

  // Esc đóng khung chat
  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [close]);

  const submit = (text: string) => {
    const content = text.trim();
    if (!content || isTyping) return;
    send(content, pickAssistantReply(content, locale));
    setDraft("");
    inputRef.current?.focus();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(draft);
  };

  // Enter gửi, Shift + Enter xuống dòng (bỏ qua khi đang gõ dấu bằng bộ gõ IME)
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit(draft);
    }
  };

  return (
    <motion.section
      role="dialog"
      aria-label={t("title")}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.98 }}
      transition={{ duration: 0.25, ease: EASE }}
      className="admin-shell fixed inset-0 z-50 flex h-dvh origin-bottom-right flex-col bg-white sm:inset-auto sm:bottom-5 sm:right-5 sm:h-[min(640px,calc(100dvh-2.5rem))] sm:w-[400px] sm:rounded-2xl sm:border sm:border-[#E4E4E7] sm:shadow-[0_24px_48px_-24px_rgba(9,9,11,0.35)]"
    >
      <header className="flex items-center gap-3 px-4 py-3.5 pt-[max(0.875rem,env(safe-area-inset-top))] sm:pt-3.5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full border border-[#E4E4E7] text-[#52525B]">
          <Sparkles size={18} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold text-[#09090B]">{t("title")}</h2>
          <p className="flex items-center gap-1.5 text-xs text-[#71717A]">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
            {t("subtitle")}
          </p>
        </div>
        {messages.length > 0 && (
          <AdminTooltip content={t("reset")}>
            <button
              type="button"
              onClick={reset}
              aria-label={t("reset")}
              className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-[#71717A] transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B]"
            >
              <RotateCcw size={16} aria-hidden />
            </button>
          </AdminTooltip>
        )}
        <button
          type="button"
          onClick={close}
          aria-label={t("close")}
          className="grid size-9 shrink-0 cursor-pointer place-items-center rounded-lg text-[#71717A] transition-colors hover:bg-[#F4F4F5] hover:text-[#09090B]"
        >
          <X size={18} aria-hidden />
        </button>
      </header>

      <div aria-hidden className="mx-4 border-t border-dashed border-[#E4E4E7]" />

      <div
        ref={listRef}
        aria-live="polite"
        className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4"
      >
        <Bubble role="assistant">{t("greeting")}</Bubble>

        {messages.map((message) => (
          <Bubble key={message.id} role={message.role}>
            {message.content}
          </Bubble>
        ))}

        {isTyping && (
          <div
            className="flex w-fit items-center gap-1 rounded-2xl rounded-bl-md bg-[#F4F4F5] px-3.5 py-3"
            aria-label={t("typing")}
          >
            {[0, 1, 2].map((dot) => (
              <span
                key={dot}
                className="size-1.5 animate-bounce rounded-full bg-[#A1A1AA]"
                style={{ animationDelay: `${dot * 150}ms` }}
              />
            ))}
          </div>
        )}

        {messages.length === 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {ASSISTANT_SUGGESTIONS.map((suggestion) => {
              const label = locale === "en" ? suggestion.en : suggestion.vi;
              return (
                <button
                  key={suggestion.vi}
                  type="button"
                  onClick={() => submit(label)}
                  className="cursor-pointer rounded-full border border-[#E4E4E7] bg-white px-3 py-1.5 text-left text-xs font-medium text-[#3F3F46] transition-colors hover:bg-[#FAFAFA] hover:text-[#09090B]"
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="border-t border-[#E4E4E7] px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:pb-3"
      >
        <div className="flex items-end gap-2 rounded-xl border border-[#E4E4E7] bg-white p-1.5 pl-3 focus-within:border-[#18181B]">
          <textarea
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            maxLength={1000}
            autoFocus
            aria-label={t("placeholder")}
            placeholder={t("placeholder")}
            // text-base trên điện thoại để iOS không tự phóng to khi focus
            className="max-h-32 min-h-8 flex-1 resize-none bg-transparent py-1.5 text-base text-[#09090B] outline-none [field-sizing:content] placeholder:text-[#A1A1AA] sm:text-sm"
          />
          <button
            type="submit"
            disabled={!draft.trim() || isTyping}
            aria-label={t("send")}
            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg bg-[#18181B] text-white transition-colors hover:bg-[#09090B] disabled:cursor-not-allowed disabled:bg-[#E4E4E7] disabled:text-[#A1A1AA]"
          >
            <ArrowUp size={16} aria-hidden />
          </button>
        </div>
        <p className="mt-2 text-center text-2xs text-[#A1A1AA]">{t("disclaimer")}</p>
      </form>
    </motion.section>
  );
}

function Bubble({ role, children }: { role: "user" | "assistant"; children: string }) {
  return (
    <p
      className={cn(
        "w-fit max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
        role === "user" ? "ml-auto rounded-br-md bg-[#18181B] text-white" : "rounded-bl-md bg-[#F4F4F5] text-[#09090B]"
      )}
    >
      {children}
    </p>
  );
}
