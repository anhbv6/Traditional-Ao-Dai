'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { Rating, RoundedStar } from '@smastrom/react-rating';
import '@smastrom/react-rating/style.css';
import { MessageCircle, ThumbsDown, ThumbsUp } from 'lucide-react';
import { ActionButton } from '@/components/shared/ActionButton';
import { TextAreaField } from '@/components/shared/TextAreaField';
import { cn } from '@/lib/utils';
import { type ProductReview, type ReviewReply } from '../../data/productReviews';

/** Màu sao dùng chung cho mọi chỗ hiển thị điểm trong tab Đánh giá */
export const reviewRatingStyles = {
  itemShapes: RoundedStar,
  activeFillColor: '#C9962B',
  inactiveFillColor: '#EFE4D8',
};

const REPLY_MAX_LENGTH = 300;

type Vote = 'like' | 'dislike' | null;

interface ReviewItemProps {
  review: ProductReview;
  locale: 'vi' | 'en';
  formatDate: (iso: string) => string;
}

/**
 * Một đánh giá trong danh sách:
 * - Thích / Không thích: mỗi người chọn một trong hai, bấm lại để bỏ; số đếm cập nhật ngay, biểu tượng nảy nhẹ.
 * - Phản hồi 1 cấp: nút "Phản hồi" mở ô nhập (TextAreaField + ActionButton dùng chung). Phản hồi hiển thị thụt vào,
 *   KHÔNG có nút phản hồi tiếp (giữ hội thoại phẳng, dễ đọc). Phản hồi của cửa hàng có nhãn riêng.
 * - Chưa có API: lượt bình chọn và phản hồi mới chỉ lưu trong trạng thái của trang.
 */
export function ReviewItem({ review, locale, formatDate }: ReviewItemProps) {
  const t = useTranslations('Product.details');
  const [vote, setVote] = useState<Vote>(null);
  const [replies, setReplies] = useState<ReviewReply[]>(review.replies ?? []);
  const [isReplying, setIsReplying] = useState(false);
  const [draft, setDraft] = useState('');
  const [replyError, setReplyError] = useState<string | null>(null);

  const likeCount = review.likes + (vote === 'like' ? 1 : 0);
  const dislikeCount = review.dislikes + (vote === 'dislike' ? 1 : 0);
  const toggleVote = (next: Exclude<Vote, null>) => setVote((current) => (current === next ? null : next));

  const closeReply = () => {
    setIsReplying(false);
    setDraft('');
    setReplyError(null);
  };

  const submitReply = () => {
    const content = draft.trim();
    if (!content) {
      setReplyError(t('replyRequired'));
      return;
    }
    setReplies((current) => [
      ...current,
      { id: `${review.id}-local-${current.length + 1}`, name: t('replyYou'), date: new Date().toISOString().slice(0, 10), content: { vi: content, en: content } },
    ]);
    closeReply();
  };

  return (
    <article className="flex gap-4 py-6">
      <div className="relative size-11 shrink-0 overflow-hidden rounded-full bg-[var(--bg-secondary)]">
        <Image src={review.avatar} alt={review.name} fill sizes="44px" className="object-cover object-top" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <p className="font-semibold text-[var(--text-main)]">{review.name}</p>
          <time dateTime={review.date} className="text-xs text-[var(--text-light)]">
            {formatDate(review.date)}
          </time>
        </div>
        <Rating style={{ maxWidth: 80 }} value={review.score} itemStyles={reviewRatingStyles} readOnly className="mt-1.5" />
        <h4 className="mt-3 font-semibold leading-6 text-[var(--text-main)]">{review.title[locale]}</h4>
        <p className="mt-1.5 leading-7 text-[var(--text-light)]">{review.content[locale]}</p>

        {review.media?.length ? (
          <ul className="mt-3 flex flex-wrap gap-2" aria-label={t('reviewFilterMedia')}>
            {review.media.map((src, index) => (
              <li key={src} className="relative size-16 overflow-hidden bg-[var(--bg-secondary)] sm:size-20">
                <Image src={src} alt={`${review.name} ${index + 1}`} fill sizes="80px" className="object-cover" />
              </li>
            ))}
          </ul>
        ) : null}

        {/* ---------- Thanh tương tác: hữu ích / không hữu ích / phản hồi ---------- */}
        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs">
          <span className="text-[var(--text-light)]">{t('helpfulQuestion')}</span>
          <VoteButton
            active={vote === 'like'}
            count={likeCount}
            label={t('helpfulYes')}
            onClick={() => toggleVote('like')}
            icon={<ThumbsUp size={15} strokeWidth={1.6} />}
          />
          <VoteButton
            active={vote === 'dislike'}
            count={dislikeCount}
            label={t('helpfulNo')}
            onClick={() => toggleVote('dislike')}
            icon={<ThumbsDown size={15} strokeWidth={1.6} />}
          />
          <button
            type="button"
            onClick={() => (isReplying ? closeReply() : setIsReplying(true))}
            aria-expanded={isReplying}
            className="inline-flex cursor-pointer items-center gap-1.5 text-[var(--text-light)] transition-colors hover:text-[var(--primary-ink)]"
          >
            <MessageCircle size={15} strokeWidth={1.6} />
            {t('reply')}
            {replies.length > 0 ? <span className="tabular-nums">({replies.length})</span> : null}
          </button>
        </div>

        {/* ---------- Phản hồi 1 cấp ---------- */}
        {replies.length > 0 || isReplying ? (
          <div className="mt-4 space-y-4 border-l-2 border-[var(--border)] pl-4 sm:pl-5">
            <AnimatePresence initial={false}>
              {replies.map((reply) => (
                <motion.div
                  key={reply.id}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                    <p className="text-sm font-semibold text-[var(--text-main)]">{reply.name}</p>
                    {reply.isShop ? (
                      <span className="bg-[var(--primary-color)] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-[1px] text-white">
                        {t('shopBadge')}
                      </span>
                    ) : null}
                    <time dateTime={reply.date} className="text-xs text-[var(--text-light)]">
                      · {formatDate(reply.date)}
                    </time>
                  </div>
                  <p className="mt-1 text-sm leading-6 text-[var(--text-light)]">{reply.content[locale]}</p>
                </motion.div>
              ))}
            </AnimatePresence>

            <AnimatePresence initial={false}>
              {isReplying ? (
                <motion.div
                  key="reply-form"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                  className="overflow-hidden"
                >
                  <TextAreaField
                    appearance="outline"
                    aria-label={t('replyPlaceholder', { name: review.name })}
                    placeholder={t('replyPlaceholder', { name: review.name })}
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
                      if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
                        event.preventDefault();
                        submitReply();
                      }
                    }}
                    error={replyError}
                  />
                  <div className="mt-3 flex justify-end gap-2">
                    <ActionButton type="button" variant="cancel" size="sm" onClick={closeReply}>
                      {t('replyCancel')}
                    </ActionButton>
                    <ActionButton type="button" variant="confirm" size="sm" onClick={submitReply}>
                      {t('replySubmit')}
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

/** Nút Thích / Không thích: đổi màu đỏ đô khi chọn, biểu tượng nảy nhẹ mỗi lần bấm */
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
      aria-label={`${label} (${count})`}
      whileTap={{ scale: 0.88 }}
      className={cn(
        'inline-flex cursor-pointer items-center gap-1.5 transition-colors',
        active ? 'font-semibold text-[var(--primary-ink)]' : 'text-[var(--text-light)] hover:text-[var(--text-main)]'
      )}
    >
      <motion.span
        key={active ? 'on' : 'off'}
        initial={{ scale: active ? 0.6 : 1 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15 }}
        className={cn('grid place-items-center', active && '[&_svg]:fill-current')}
      >
        {icon}
      </motion.span>
      <span className="tabular-nums">{count}</span>
    </motion.button>
  );
}
