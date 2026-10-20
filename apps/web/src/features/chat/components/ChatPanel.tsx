"use client";

import React, { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowLeftRight, SendHorizontal, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CHAT_AGENTS, CHAT_GREETINGS, CHAT_SUGGESTIONS, CHAT_TYPING_DELAY, pickMockReply } from "../data/chatMock";
import { useChatStore } from "../store/chatStore";
import { type ChatChannel, type ChatMessage } from "../types/chat.types";

const MESSAGE_MAX_LENGTH = 500;
const EASE = [0.22, 1, 0.36, 1] as const;

interface ChatPanelProps {
  channel: ChatChannel;
  /** Đẩy khung lên khi trang có thanh cố định ở đáy (mobile) */
  raised: boolean;
}

/**
 * Khung chat nổi (mock):
 * - Đầu khung: người trả lời + trạng thái, nút chuyển nhanh sang kênh còn lại và nút đóng.
 * - Thân: tin chào mẫu + tin trong phiên, chỉ báo "đang soạn tin"; câu hỏi gợi ý khi khách chưa nhắn gì.
 * - Chân: ô nhập (Enter gửi, Shift + Enter xuống dòng). Kênh AI có dòng lưu ý thông tin chỉ mang tính tham khảo.
 * - Esc đóng khung; mở khung thì con trỏ vào ô nhập ngay.
 */
export function ChatPanel({ channel, raised }: ChatPanelProps) {
  const t = useTranslations("Chat");
  const loc: "vi" | "en" = useLocale() === "en" ? "en" : "vi";
  const messages = useChatStore((state) => state.messages[channel]);
  const isTyping = useChatStore((state) => state.typing[channel]);
  const { open, close, send } = useChatStore.getState();
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const agent = CHAT_AGENTS[channel];
  const otherChannel: ChatChannel = channel === "shop" ? "ai" : "shop";
  const greetings: ChatMessage[] = CHAT_GREETINGS[channel].map((text, index) => ({
    id: `greeting-${channel}-${index}`,
    sender: "agent",
    content: text[loc],
  }));
  const allMessages = [...greetings, ...messages];
  const hasUserMessage = messages.some((message) => message.sender === "me");

  const timeFormatter = new Intl.DateTimeFormat(loc === "vi" ? "vi-VN" : "en-US", { hour: "2-digit", minute: "2-digit" });

  // Có tin mới / đang soạn -> cuộn xuống cuối
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }, [messages.length, isTyping, channel]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [channel]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [close]);

  const submit = (text: string) => {
    const content = text.trim();
    if (!content || isTyping) return;
    send(channel, content, pickMockReply(channel, content, loc), CHAT_TYPING_DELAY[channel]);
    setDraft("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(draft);
  };

  return (
    <motion.section
      role="dialog"
      aria-label={t(`${channel}.title`)}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.3, ease: EASE }}
      className={cn(
        "fixed inset-x-3 z-[60] flex origin-bottom-right flex-col overflow-hidden border border-[var(--border)] bg-[var(--bg-card)] shadow-[0_24px_60px_-24px_rgba(42,37,37,0.4)]",
        "h-[min(34rem,calc(100svh-var(--site-header-h)-2rem))] sm:inset-x-auto sm:right-7 sm:w-[22.5rem]",
        raised ? "bottom-24 lg:bottom-7" : "bottom-3 sm:bottom-7"
      )}
    >
      {/* ---------- Đầu khung ---------- */}
      <header className="flex items-center gap-3 border-b border-[var(--border)] px-4 py-3">
        <span className="relative shrink-0">
          {agent.avatar ? (
            <span className="relative block size-10 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
              <Image src={agent.avatar} alt="" fill sizes="40px" className="object-cover object-top" />
            </span>
          ) : (
            <span className="grid size-10 place-items-center rounded-full bg-[var(--primary-color)] text-white">
              <Sparkles size={18} strokeWidth={1.7} />
            </span>
          )}
          <span aria-hidden="true" className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-[var(--bg-card)] bg-emerald-600" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-[family-name:var(--font-playfair)] text-[15px] font-semibold text-[var(--text-main)]">
            {t(`${channel}.title`)}
          </p>
          <p className="truncate text-[11px] text-[var(--text-light)]">{t(`${channel}.status`, { name: agent.name })}</p>
        </div>
        <button
          type="button"
          onClick={() => open(otherChannel)}
          aria-label={t("switchTo", { channel: t(`${otherChannel}.title`) })}
          title={t("switchTo", { channel: t(`${otherChannel}.title`) })}
          className="grid size-8 shrink-0 cursor-pointer place-items-center text-[var(--text-light)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--primary-ink)]"
        >
          <ArrowLeftRight size={15} strokeWidth={1.7} />
        </button>
        <button
          type="button"
          onClick={close}
          aria-label={t("close")}
          className="grid size-8 shrink-0 cursor-pointer place-items-center text-[var(--text-light)] transition-colors hover:bg-[var(--bg-secondary)] hover:text-[var(--text-main)]"
        >
          <X size={16} />
        </button>
      </header>

      {/* ---------- Tin nhắn: cuộn riêng, không kéo theo trang (data-lenis-prevent) ---------- */}
      <div
        ref={listRef}
        data-lenis-prevent
        role="log"
        aria-live="polite"
        className="scrollbar-brand flex-1 space-y-2.5 overflow-y-auto overscroll-contain bg-[var(--bg-main)] px-4 py-4"
      >
        {allMessages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            time={message.sentAt ? timeFormatter.format(new Date(message.sentAt)) : null}
          />
        ))}

        {isTyping ? (
          <div className="flex" aria-label={t("typing", { name: agent.name })}>
            <span className="inline-flex items-center gap-1 bg-[var(--bg-card)] px-3.5 py-3 ring-1 ring-[var(--border)]">
              {[0, 1, 2].map((dot) => (
                <motion.span
                  key={dot}
                  className="size-1.5 rounded-full bg-[var(--text-light)]"
                  animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                  transition={{ duration: 1, repeat: Infinity, delay: dot * 0.15 }}
                />
              ))}
            </span>
          </div>
        ) : null}

        {!hasUserMessage ? (
          <div className="flex flex-wrap gap-1.5 pt-2">
            {CHAT_SUGGESTIONS[channel].map((suggestion) => (
              <button
                key={suggestion.vi}
                type="button"
                onClick={() => submit(suggestion[loc])}
                className="cursor-pointer border border-[var(--primary-color)]/30 bg-[var(--bg-card)] px-3 py-1.5 text-xs text-[var(--primary-ink)] transition-colors hover:border-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white"
              >
                {suggestion[loc]}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* ---------- Ô nhập ---------- */}
      <form onSubmit={handleSubmit} className="border-t border-[var(--border)] px-3 pb-3 pt-2.5">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            rows={1}
            value={draft}
            maxLength={MESSAGE_MAX_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
                event.preventDefault();
                submit(draft);
              }
            }}
            placeholder={t(`${channel}.placeholder`)}
            aria-label={t(`${channel}.placeholder`)}
            className="max-h-28 min-h-10 flex-1 resize-none border border-[var(--border)] bg-[var(--bg-main)] px-3 py-2.5 text-sm leading-5 text-[var(--text-main)] outline-none transition-colors [field-sizing:content] placeholder:text-[var(--text-light)]/70 focus:border-[var(--primary-color)]"
          />
          <button
            type="submit"
            disabled={!draft.trim() || isTyping}
            aria-label={t("send")}
            className="grid size-10 shrink-0 cursor-pointer place-items-center bg-[var(--primary-color)] text-white transition-colors hover:bg-[var(--bg-inverse)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <SendHorizontal size={16} strokeWidth={1.8} />
          </button>
        </div>
        {channel === "ai" ? <p className="mt-2 text-[10px] leading-4 text-[var(--text-light)]">{t("ai.disclaimer")}</p> : null}
      </form>
    </motion.section>
  );
}

function MessageBubble({ message, time }: { message: ChatMessage; time: string | null }) {
  const isMine = message.sender === "me";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("flex flex-col", isMine ? "items-end" : "items-start")}
    >
      <p
        className={cn(
          "max-w-[85%] whitespace-pre-line break-words px-3.5 py-2.5 text-[13px] leading-5",
          isMine
            ? "bg-[var(--primary-color)] text-white"
            : "bg-[var(--bg-card)] text-[var(--text-main)] ring-1 ring-[var(--border)]"
        )}
      >
        {message.content}
      </p>
      {time ? <time className="mt-1 px-0.5 text-[10px] text-[var(--text-light)]">{time}</time> : null}
    </motion.div>
  );
}
