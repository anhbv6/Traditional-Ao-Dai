"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "motion/react";
import { Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAssistantStore } from "../store/assistantStore";

// Khung chat (kèm dữ liệu trả lời mẫu) chỉ tải khi mở lần đầu -> không nằm trong bundle chung của admin
const AdminAssistantPanel = dynamic(() => import("./AdminAssistantPanel").then((m) => m.AdminAssistantPanel), {
  ssr: false,
});

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Nút trợ lý AI nổi góc dưới bên phải khu quản trị; bấm mở khung chat (khung mở thì nút ẩn đi).
 */
export function AdminAssistantDock() {
  const t = useTranslations("AdminPage.assistant");
  const isOpen = useAssistantStore((state) => state.isOpen);
  const open = useAssistantStore((state) => state.open);

  return (
    <AnimatePresence initial={false}>
      {isOpen ? (
        <AdminAssistantPanel key="assistant-panel" />
      ) : (
        <motion.button
          key="assistant-button"
          type="button"
          onClick={open}
          aria-label={t("open")}
          title={t("open")}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2, ease: EASE }}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] right-4 z-40 grid size-12 cursor-pointer place-items-center rounded-full bg-[#18181B] text-white shadow-[0_12px_24px_-12px_rgba(9,9,11,0.6)] outline-none transition-colors hover:bg-[#09090B] focus-visible:ring-4 focus-visible:ring-[#18181B]/20 sm:bottom-5 sm:right-5"
        >
          <Sparkles size={20} strokeWidth={1.8} aria-hidden />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
