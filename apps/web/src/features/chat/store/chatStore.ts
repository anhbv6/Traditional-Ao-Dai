"use client";

import { create } from "zustand";
import { type ChatChannel, type ChatMessage } from "../types/chat.types";

interface ChatState {
  /** Kênh đang mở; `null` = đóng khung chat */
  openChannel: ChatChannel | null;
  /** Tin nhắn phát sinh trong phiên (tin chào mẫu lấy từ data, không lưu ở đây) */
  messages: Record<ChatChannel, ChatMessage[]>;
  /** Bên kia đang soạn tin */
  typing: Record<ChatChannel, boolean>;
  /** Kênh đã được mở ít nhất một lần (để ẩn chấm "tin mới" của tin chào) */
  seen: Record<ChatChannel, boolean>;
  /** Số tin trả lời đến lúc khung chat của kênh đó đang đóng */
  unread: Record<ChatChannel, number>;

  open: (channel: ChatChannel) => void;
  close: () => void;
  /** Gửi tin của khách rồi giả lập bên kia trả lời sau `delay` ms */
  send: (channel: ChatChannel, content: string, reply: string, delay: number) => void;
}

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

/**
 * Trạng thái chat nổi góc màn hình (mock). Chỉ giữ trong bộ nhớ: tải lại trang là bắt đầu cuộc trò chuyện mới.
 * Hẹn giờ trả lời nằm ở store nên đóng khung chat giữa chừng vẫn nhận được tin trả lời.
 */
export const useChatStore = create<ChatState>()((set) => ({
  openChannel: null,
  messages: { shop: [], ai: [] },
  typing: { shop: false, ai: false },
  seen: { shop: false, ai: false },
  unread: { shop: 0, ai: 0 },

  open: (channel) =>
    set((state) => ({
      openChannel: channel,
      seen: { ...state.seen, [channel]: true },
      unread: { ...state.unread, [channel]: 0 },
    })),
  close: () => set({ openChannel: null }),

  send: (channel, content, reply, delay) => {
    const message: ChatMessage = { id: createId("me"), sender: "me", content, sentAt: new Date().toISOString() };
    set((state) => ({
      messages: { ...state.messages, [channel]: [...state.messages[channel], message] },
      typing: { ...state.typing, [channel]: true },
    }));

    setTimeout(() => {
      const answer: ChatMessage = { id: createId("agent"), sender: "agent", content: reply, sentAt: new Date().toISOString() };
      set((state) => ({
        messages: { ...state.messages, [channel]: [...state.messages[channel], answer] },
        typing: { ...state.typing, [channel]: false },
        unread: state.openChannel === channel ? state.unread : { ...state.unread, [channel]: state.unread[channel] + 1 },
      }));
    }, delay);
  },
}));
