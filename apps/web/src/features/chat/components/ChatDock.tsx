"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { useTranslations } from "next-intl";
import { MessageCircle, Sparkles } from "lucide-react";
import { AppTooltip } from "@/components/shared/AppTooltip";
import { cn } from "@/lib/utils";
import { useHasBottomBar } from "@/hooks/useHasBottomBar";
import { FLOATING_BUTTON_CLASS } from "@/components/common/floatingButton";
import { useChatStore } from "../store/chatStore";
import { type ChatChannel } from "../types/chat.types";
import { ChatPanel } from "./ChatPanel";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Cụm nút chat nổi góc dưới bên phải (storefront):
 * - Trên: Trợ lý AI. Dưới: Chat với cửa hàng — admin / nhân viên. Cùng kiểu FLOATING_BUTTON_CLASS với nút "Lên đầu trang".
 * - Chấm / số đỏ: tin chào chưa xem hoặc tin trả lời đến khi khung đang đóng.
 * - Mở một kênh -> cụm nút ẩn đi, khung chat chiếm góc màn hình (nút chuyển kênh nằm trong khung).
 * Nút "Lên đầu trang" (ScrollToTopButton) đặt ngay phía trên cụm này.
 */
export function ChatDock() {
  const t = useTranslations("Chat");
  const raised = useHasBottomBar();
  const openChannel = useChatStore((state) => state.openChannel);
  const seen = useChatStore((state) => state.seen);
  const unread = useChatStore((state) => state.unread);
  const open = useChatStore((state) => state.open);

  const badge = (channel: ChatChannel) => (unread[channel] > 0 ? String(unread[channel]) : !seen[channel] && channel === "shop" ? "1" : null);

  return (
    <>
      <AnimatePresence>
        {openChannel ? null : (
          <motion.div
            key="chat-dock"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3, ease: EASE }}
            className={cn(
              "fixed right-5 z-40 flex flex-col items-center gap-3 sm:right-7",
              raised ? "bottom-24 lg:bottom-7" : "bottom-7"
            )}
          >
            <DockButton
              label={t("ai.open")}
              badge={badge("ai")}
              onClick={() => open("ai")}
            >
              <Sparkles size={18} strokeWidth={1.8} />
            </DockButton>
            <DockButton
              label={t("shop.open")}
              badge={badge("shop")}
              onClick={() => open("shop")}
            >
              <MessageCircle size={18} strokeWidth={1.8} />
            </DockButton>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>{openChannel ? <ChatPanel key={openChannel} channel={openChannel} raised={raised} /> : null}</AnimatePresence>
    </>
  );
}

function DockButton({
  label,
  badge,
  onClick,
  children,
}: {
  label: string;
  badge: string | null;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <AppTooltip content={label} side="left">
      <motion.button
        type="button"
        onClick={onClick}
        aria-label={badge ? `${label} (${badge})` : label}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.94 }}
        className={cn("relative", FLOATING_BUTTON_CLASS)}
      >
        {children}
        {badge ? (
          <span className="absolute -right-0.5 -top-0.5 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-[var(--bg-main)] bg-[var(--destructive)] px-1 text-[10px] font-semibold leading-none text-white">
            {badge}
          </span>
        ) : null}
      </motion.button>
    </AppTooltip>
  );
}
