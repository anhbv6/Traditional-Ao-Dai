"use client";

import React from "react";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Rating } from "@smastrom/react-rating";
import "@smastrom/react-rating/style.css";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { type ArticleEngagement } from "../../hooks/useArticleEngagement";
import { newsRatingStyles } from "./newsBlock";

interface NewsFeedbackProps {
  engagement: ArticleEngagement;
}

/**
 * Phần "Đánh giá bài viết" (nằm trong khối NewsEngagement, trên phần bình luận):
 * - Hữu ích / Chưa hữu ích: chọn một trong hai, bấm lại để bỏ; số đếm cập nhật ngay.
 * - Chấm sao: điểm trung bình + số lượt bên trái, sao của người xem bên phải (chấm lại được).
 */
export function NewsFeedback({ engagement }: NewsFeedbackProps) {
  const t = useTranslations("NewsPage.feedback");
  const locale = useLocale();
  const { vote, likes, dislikes, myRating, averageRating, ratingCount, toggleVote, rate } = engagement;
  const scoreText = new Intl.NumberFormat(locale === "en" ? "en-US" : "vi-VN", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(averageRating);

  return (
    <div>
      {/* ---------- Hữu ích / chưa hữu ích ---------- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[var(--text-light)]">{t("helpfulQuestion")}</p>
        <div className="flex gap-2">
          <VoteButton
            active={vote === "like"}
            count={likes}
            label={t("like")}
            onClick={() => toggleVote("like")}
            icon={<ThumbsUp size={16} strokeWidth={1.6} />}
          />
          <VoteButton
            active={vote === "dislike"}
            count={dislikes}
            label={t("dislike")}
            onClick={() => toggleVote("dislike")}
            icon={<ThumbsDown size={16} strokeWidth={1.6} />}
          />
        </div>
      </div>
      <AnimatePresence>
        {vote ? (
          <motion.p
            role="status"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 overflow-hidden text-xs text-[var(--primary-ink)] sm:text-right"
          >
            {t("voteThanks")}
          </motion.p>
        ) : null}
      </AnimatePresence>

      {/* ---------- Chấm sao ---------- */}
      <div className="mt-6 grid gap-6 border-t border-[var(--border)] pt-6 sm:grid-cols-2 sm:gap-8">
        <div className="flex items-center gap-4">
          <p className="font-[family-name:var(--font-playfair)] text-[2.75rem] font-semibold leading-none text-[var(--text-main)]">
            {scoreText}
          </p>
          <div>
            <Rating style={{ maxWidth: 110 }} value={averageRating} itemStyles={newsRatingStyles} readOnly />
            <p className="mt-1.5 text-xs text-[var(--text-light)]">{t("ratingCount", { count: ratingCount })}</p>
          </div>
        </div>

        <div className="sm:border-l sm:border-[var(--border)] sm:pl-8">
          <p id="news-rating-label" className="text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--text-light)]">
            {t("yourRating")}
          </p>
          <Rating
            style={{ maxWidth: 150 }}
            value={myRating}
            onChange={(value: number) => rate(value)}
            itemStyles={newsRatingStyles}
            visibleLabelId="news-rating-label"
            className="mt-2.5"
          />
          <p role="status" className="mt-2 text-xs text-[var(--text-light)]">
            {myRating > 0 ? t("rated", { score: myRating }) : t("ratePrompt")}
          </p>
        </div>
      </div>
    </div>
  );
}

/** Nút dạng viên: đổi sang đỏ đô khi chọn, biểu tượng nảy nhẹ mỗi lần bấm */
function VoteButton({
  active,
  count,
  label,
  onClick,
  icon,
}: {
  active: boolean;
  count: number;
  label: string;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      whileTap={{ scale: 0.92 }}
      className={cn(
        "inline-flex min-h-10 cursor-pointer items-center gap-2 border px-4 text-[13px] transition-colors duration-300",
        active
          ? "border-[var(--primary-color)] bg-[var(--primary-color)] text-white"
          : "border-[var(--border)] text-[var(--text-main)] hover:border-[var(--primary-color)] hover:text-[var(--primary-ink)]"
      )}
    >
      <motion.span
        key={active ? "on" : "off"}
        initial={{ scale: active ? 0.6 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 500, damping: 15 }}
        className={cn("grid place-items-center", active && "[&_svg]:fill-current")}
      >
        {icon}
      </motion.span>
      {label}
      <span className="tabular-nums opacity-80">{count}</span>
    </motion.button>
  );
}
