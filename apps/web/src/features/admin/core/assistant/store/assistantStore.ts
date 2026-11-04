"use client";

import { create } from "zustand";
import { type AssistantMessage } from "../types/assistant.types";

interface AssistantState {
  isOpen: boolean;
  messages: AssistantMessage[];
  /** Trợ lý đang "soạn" câu trả lời */
  isTyping: boolean;

  open: () => void;
  close: () => void;
  /** Gửi tin rồi giả lập trợ lý trả lời sau một khoảng ngắn */
  send: (content: string, reply: string) => void;
  reset: () => void;
}

// Độ trễ giả lập trợ lý "suy nghĩ" — dao động nhẹ cho tự nhiên
const REPLY_DELAY_MS = 700;
const REPLY_JITTER_MS = 500;

let replyTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Trạng thái trợ lý AI khu quản trị (mock). Chỉ giữ trong bộ nhớ: chuyển trang admin vẫn giữ cuộc trò chuyện,
 * tải lại trang là bắt đầu mới. Hẹn giờ trả lời nằm ở store nên đóng khung giữa chừng vẫn nhận được trả lời.
 */
export const useAssistantStore = create<AssistantState>()((set) => ({
  isOpen: false,
  messages: [],
  isTyping: false,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  send: (content, reply) => {
    set((state) => ({
      messages: [...state.messages, { id: crypto.randomUUID(), role: "user", content }],
      isTyping: true,
    }));
    if (replyTimer) clearTimeout(replyTimer);
    replyTimer = setTimeout(
      () => {
        replyTimer = null;
        set((state) => ({
          messages: [...state.messages, { id: crypto.randomUUID(), role: "assistant", content: reply }],
          isTyping: false,
        }));
      },
      REPLY_DELAY_MS + Math.random() * REPLY_JITTER_MS
    );
  },
  reset: () => {
    if (replyTimer) clearTimeout(replyTimer);
    replyTimer = null;
    set({ messages: [], isTyping: false });
  },
}));
