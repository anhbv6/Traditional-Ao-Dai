"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, Link2, Share2 } from "lucide-react";
import { FaFacebookF } from "react-icons/fa";
import { useTranslations } from "next-intl";

interface NewsShareProps {
  title: string;
  /** `column`: dọc trong cột dính · `row`: hàng ngang cuối bài */
  layout?: "column" | "row";
}

const COPIED_FEEDBACK_MS = 1800;

/**
 * Chia sẻ bài viết: sao chép liên kết (biểu tượng chuyển sang dấu tích), Facebook, và chia sẻ của hệ điều hành (nếu có).
 * Địa chỉ trang lấy lúc bấm (không đọc `window` khi render -> không lệch hydration).
 */
export function NewsShare({ title, layout = "row" }: NewsShareProps) {
  const t = useTranslations("NewsPage");
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), COPIED_FEEDBACK_MS);
    } catch {
      // Trình duyệt chặn clipboard -> bỏ qua, khách vẫn sao chép được từ thanh địa chỉ
    }
  };

  const shareFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
    window.open(url, "_blank", "noopener,noreferrer,width=640,height=560");
  };

  const shareNative = async () => {
    if (!navigator.share) {
      void copyLink();
      return;
    }
    try {
      await navigator.share({ title, url: window.location.href });
    } catch {
      // Khách hủy chia sẻ -> không làm gì
    }
  };

  const buttonClass =
    "grid size-9 cursor-pointer place-items-center border border-[var(--border)] bg-white text-[var(--text-main)] transition-colors duration-300 hover:border-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white";

  return (
    <div className={layout === "column" ? "flex flex-col items-start gap-2" : "flex flex-wrap items-center gap-2"}>
      <p className="text-[10px] uppercase tracking-[2.5px] text-[var(--text-light)]">{t("share.title")}</p>
      <div className={layout === "column" ? "flex gap-2" : "flex gap-2 sm:ml-2"}>
        <button type="button" onClick={copyLink} aria-label={copied ? t("share.copied") : t("share.copy")} title={t("share.copy")} className={buttonClass}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={copied ? "copied" : "copy"}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {copied ? <Check size={15} /> : <Link2 size={15} strokeWidth={1.6} />}
            </motion.span>
          </AnimatePresence>
        </button>
        <button type="button" onClick={shareFacebook} aria-label={t("share.facebook")} title={t("share.facebook")} className={buttonClass}>
          <FaFacebookF size={13} />
        </button>
        <button type="button" onClick={shareNative} aria-label={t("share.more")} title={t("share.more")} className={buttonClass}>
          <Share2 size={15} strokeWidth={1.6} />
        </button>
      </div>
      <AnimatePresence>
        {copied ? (
          <motion.span
            role="status"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-[11px] text-emerald-800"
          >
            {t("share.copied")}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
