"use client";

import React, { useState, type FormEvent } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useLocale, useTranslations } from "next-intl";
import { Heart, MessageCircle } from "lucide-react";
import { ActionButton } from "@/components/shared/ActionButton";
import { TextField } from "@/components/shared/TextField";
import { TextAreaField } from "@/components/shared/TextAreaField";
import { showToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/features/auth";
import { type ArticleEngagement, type ResolvedNewsComment } from "../../hooks/useArticleEngagement";

const COMMENT_MAX_LENGTH = 500;
const REPLY_MAX_LENGTH = 300;
/** Số bình luận hiện lúc đầu, mỗi lần "Xem thêm" mở thêm bấy nhiêu */
const PAGE_SIZE = 4;

type SortKey = "newest" | "top";

/** Id + thời điểm cho bình luận / phản hồi người xem vừa gửi (gọi trong handler, không gọi lúc render) */
const createLocalStamp = (prefix: string) => {
  const now = new Date();
  return { id: `${prefix}-local-${now.getTime()}`, date: now.toISOString() };
};

interface NewsCommentsProps {
  engagement: ArticleEngagement;
}

type FormErrors = Partial<Record<"name" | "content", string>>;

/**
 * Phần bình luận (nằm trong khối NewsEngagement, dưới phần đánh giá):
 * - Form ở đầu khối: khách đã đăng nhập bình luận bằng tên tài khoản, khách vãng lai nhập tên hiển thị.
 * - Danh sách sắp theo Mới nhất / Nhiều lượt thích, hiện dần theo trang ("Xem thêm").
 * - Mỗi bình luận: thích (bấm lại để bỏ) và trả lời 1 cấp (phản hồi không có phản hồi con).
 * - Chưa có API: bình luận / phản hồi / lượt thích lưu ở store phía trình duyệt.
 */
export function NewsComments({ engagement }: NewsCommentsProps) {
  const t = useTranslations("NewsPage.comments");
  const locale = useLocale();
  const loc: "vi" | "en" = locale === "en" ? "en" : "vi";
  const user = useAuthStore((state) => state.user);
  const accountName = user?.name?.trim() || null;

  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitCount, setSubmitCount] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("newest");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { comments, addComment } = engagement;
  const sorted = [...comments].sort((a, b) =>
    sortKey === "top" ? b.likes - a.likes || b.date.localeCompare(a.date) : b.date.localeCompare(a.date)
  );
  const visible = sorted.slice(0, visibleCount);
  const remaining = sorted.length - visible.length;

  const dateFormatter = new Intl.DateTimeFormat(loc === "vi" ? "vi-VN" : "en-US", {
    day: "2-digit",
    month: loc === "vi" ? "2-digit" : "short",
    year: "numeric",
  });
  const formatDate = (iso: string) => dateFormatter.format(new Date(iso));

  const clearError = (field: keyof FormErrors) =>
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitCount((count) => count + 1);
    const nextErrors: FormErrors = {};
    if (!accountName && !name.trim()) nextErrors.name = t("nameRequired");
    if (!content.trim()) nextErrors.content = t("contentRequired");
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const text = content.trim();
    addComment({
      ...createLocalStamp("comment"),
      name: accountName ?? name.trim(),
      avatar: user?.avatar ?? null,
      content: { vi: text, en: text },
      likes: 0,
    });
    setContent("");
    setSortKey("newest");
    showToast.success(t("submitted"));
  };

  return (
    <section aria-labelledby="news-comments-heading" className="mt-6 border-t border-[var(--border)] pt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
        <h3 id="news-comments-heading" className="text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--text-main)]">
          {t("title")} <span className="font-normal tracking-normal text-[var(--text-light)]">({comments.length})</span>
        </h3>
        <div role="group" aria-label={t("sortLabel")} className="flex gap-4 text-xs">
          {(["newest", "top"] as const).map((key) => (
            <button
              key={key}
              type="button"
              aria-pressed={sortKey === key}
              onClick={() => setSortKey(key)}
              className={cn(
                "cursor-pointer border-b pb-0.5 transition-colors",
                sortKey === key
                  ? "border-[var(--primary-color)] font-semibold text-[var(--primary-ink)]"
                  : "border-transparent text-[var(--text-light)] hover:text-[var(--text-main)]"
              )}
            >
              {t(key === "newest" ? "sortNewest" : "sortTop")}
            </button>
          ))}
        </div>
      </div>

      {/* ---------- Form bình luận ---------- */}
      <form noValidate onSubmit={handleSubmit} className="mt-5 space-y-4 bg-[var(--bg-main)] p-4 sm:p-5">
        {accountName ? (
          <p className="text-xs text-[var(--text-light)]">
            {t.rich("postingAs", { name: accountName, b: (chunks) => <strong className="text-[var(--text-main)]">{chunks}</strong> })}
          </p>
        ) : (
          <TextField
            label={t("nameLabel")}
            placeholder={t("namePlaceholder")}
            autoComplete="name"
            value={name}
            onValueChange={(value) => {
              setName(value);
              clearError("name");
            }}
            error={errors.name}
            shakeKey={submitCount}
          />
        )}
        <TextAreaField
          label={t("contentLabel")}
          placeholder={t("placeholder")}
          rows={3}
          maxLength={COMMENT_MAX_LENGTH}
          showCount
          value={content}
          onValueChange={(value) => {
            setContent(value);
            clearError("content");
          }}
          error={errors.content}
        />
        <div className="flex justify-end">
          <ActionButton type="submit" variant="confirm" size="sm">
            {t("submit")}
          </ActionButton>
        </div>
      </form>

      {/* ---------- Danh sách ---------- */}
      {visible.length > 0 ? (
        <ul className="mt-2 divide-y divide-[var(--border)]">
          <AnimatePresence initial={false}>
            {visible.map((comment) => (
              <motion.li
                key={comment.id}
                layout="position"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                <CommentItem comment={comment} loc={loc} formatDate={formatDate} engagement={engagement} replyName={accountName} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      ) : (
        <p className="mt-6 text-center text-sm text-[var(--text-light)]">{t("empty")}</p>
      )}

      {remaining > 0 ? (
        <div className="mt-2 flex justify-center border-t border-[var(--border)] pt-5">
          <ActionButton type="button" variant="dialog" size="sm" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
            {t("showMore", { count: Math.min(remaining, PAGE_SIZE) })}
          </ActionButton>
        </div>
      ) : null}
    </section>
  );
}

function Avatar({ name, src, size = "md" }: { name: string; src?: string | null; size?: "md" | "sm" }) {
  const sizeClass = size === "md" ? "size-10 text-sm" : "size-8 text-xs";
  if (src) {
    return (
      <span className={cn("relative shrink-0 overflow-hidden rounded-full bg-[var(--bg-secondary)]", sizeClass)}>
        <Image src={src} alt="" fill sizes="40px" className="object-cover object-top" />
      </span>
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-[var(--bg-secondary)] font-semibold uppercase text-[var(--primary-ink)]",
        sizeClass
      )}
    >
      {name.trim().charAt(0)}
    </span>
  );
}

interface CommentItemProps {
  comment: ResolvedNewsComment;
  loc: "vi" | "en";
  formatDate: (iso: string) => string;
  engagement: ArticleEngagement;
  /** Tên tài khoản khi đã đăng nhập — dùng làm tên người trả lời */
  replyName: string | null;
}

function CommentItem({ comment, loc, formatDate, engagement, replyName }: CommentItemProps) {
  const t = useTranslations("NewsPage.comments");
  const [isReplying, setIsReplying] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyError, setReplyError] = useState<string | null>(null);
  const replies = comment.replies ?? [];

  const closeReply = () => {
    setIsReplying(false);
    setDraft("");
    setReplyError(null);
  };

  const submitReply = () => {
    const text = draft.trim();
    if (!text) {
      setReplyError(t("replyRequired"));
      return;
    }
    engagement.addReply(comment.id, {
      ...createLocalStamp(comment.id),
      name: replyName ?? t("you"),
      content: { vi: text, en: text },
    });
    closeReply();
  };

  return (
    <article className="flex gap-3.5 py-5">
      <Avatar name={comment.name} src={comment.avatar} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <p className="text-sm font-semibold text-[var(--text-main)]">{comment.name}</p>
          <time dateTime={comment.date} className="text-xs text-[var(--text-light)]">
            · {formatDate(comment.date)}
          </time>
        </div>
        <p className="mt-1.5 whitespace-pre-line break-words text-[14px] leading-7 text-[var(--text-main)]">
          {comment.content[loc]}
        </p>

        <div className="mt-2.5 flex items-center gap-5 text-xs">
          <motion.button
            type="button"
            onClick={() => engagement.toggleCommentLike(comment.id)}
            aria-pressed={comment.likedByMe}
            aria-label={`${t("like")} (${comment.likes})`}
            whileTap={{ scale: 0.88 }}
            className={cn(
              "inline-flex cursor-pointer items-center gap-1.5 transition-colors",
              comment.likedByMe ? "font-semibold text-[var(--primary-ink)]" : "text-[var(--text-light)] hover:text-[var(--text-main)]"
            )}
          >
            <Heart size={14} strokeWidth={1.7} className={comment.likedByMe ? "fill-current" : undefined} />
            <span className="tabular-nums">{comment.likes}</span>
          </motion.button>
          <button
            type="button"
            onClick={() => (isReplying ? closeReply() : setIsReplying(true))}
            aria-expanded={isReplying}
            className="inline-flex cursor-pointer items-center gap-1.5 text-[var(--text-light)] transition-colors hover:text-[var(--primary-ink)]"
          >
            <MessageCircle size={14} strokeWidth={1.6} />
            {t("reply")}
            {replies.length > 0 ? <span className="tabular-nums">({replies.length})</span> : null}
          </button>
        </div>

        {/* ---------- Phản hồi 1 cấp ---------- */}
        {replies.length > 0 || isReplying ? (
          <div className="mt-4 space-y-4 border-l-2 border-[var(--border)] pl-4">
            {replies.map((reply) => (
              <div key={reply.id} className="flex gap-3">
                <Avatar name={reply.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="text-sm font-semibold text-[var(--text-main)]">{reply.name}</p>
                    {reply.isAuthor ? (
                      <span className="bg-[var(--primary-color)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[1px] text-white">
                        {t("authorBadge")}
                      </span>
                    ) : null}
                    <time dateTime={reply.date} className="text-xs text-[var(--text-light)]">
                      · {formatDate(reply.date)}
                    </time>
                  </div>
                  <p className="mt-1 whitespace-pre-line break-words text-sm leading-6 text-[var(--text-light)]">{reply.content[loc]}</p>
                </div>
              </div>
            ))}

            <AnimatePresence initial={false}>
              {isReplying ? (
                <motion.div
                  key="reply-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="overflow-hidden"
                >
                  <TextAreaField
                    appearance="outline"
                    aria-label={t("replyPlaceholder", { name: comment.name })}
                    placeholder={t("replyPlaceholder", { name: comment.name })}
                    rows={2}
                    maxLength={REPLY_MAX_LENGTH}
                    showCount
                    autoFocus
                    value={draft}
                    onValueChange={(value) => {
                      setDraft(value);
                      if (replyError) setReplyError(null);
                    }}
                    onKeyDown={(event) => {
                      // Ctrl/⌘ + Enter để gửi nhanh
                      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                        event.preventDefault();
                        submitReply();
                      }
                    }}
                    error={replyError}
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <ActionButton type="button" variant="cancel" size="sm" onClick={closeReply}>
                      {t("replyCancel")}
                    </ActionButton>
                    <ActionButton type="button" variant="confirm" size="sm" onClick={submitReply}>
                      {t("replySubmit")}
                    </ActionButton>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        ) : null}
      </div>
    </article>
  );
}
