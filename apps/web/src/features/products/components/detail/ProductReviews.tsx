'use client';

import { useState, type FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { Rating } from '@smastrom/react-rating';
import '@smastrom/react-rating/style.css';
import { emailSchema } from '@repo/shared';
import { ActionButton } from '@/components/shared/ActionButton';
import { AppDialog } from '@/components/shared/AppDialog';
import { TextField } from '@/components/shared/TextField';
import { TextAreaField } from '@/components/shared/TextAreaField';
import { MediaUploader, type MediaItem } from '@/components/shared/MediaUploader';
import { showToast } from '@/components/ui/toast';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Camera, PenLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FilterChip } from '../FilterSidebar';
import { productReviews } from '../../data/productReviews';
import { ReviewItem, reviewRatingStyles } from './ReviewItem';

type ReviewSortKey = 'newest' | 'highest' | 'lowest';
const REVIEW_SORT_KEYS: ReviewSortKey[] = ['newest', 'highest', 'lowest'];

/* Số liệu mock — thay bằng API đánh giá khi có module reviews */
const AVERAGE_SCORE = 5.0;
export const REVIEW_TOTAL = 121;
/** Tỉ lệ % theo số sao, từ 5 sao xuống 1 sao */
const DISTRIBUTION: { stars: number; percent: number }[] = [
  { stars: 5, percent: 86 },
  { stars: 4, percent: 10 },
  { stars: 3, percent: 3 },
  { stars: 2, percent: 1 },
  { stars: 1, percent: 0 },
];
const REVIEW_MAX_LENGTH = 500;
const REVIEW_FORM_ID = 'product-review-form';

interface ProductReviewsProps {
  locale: 'vi' | 'en';
}

type ReviewErrors = Partial<Record<'rating' | 'name' | 'email' | 'content', string>>;

/**
 * Tab "Đánh giá" (cột cạnh ảnh, một cột):
 * - Điểm trung bình + biểu đồ tỉ lệ theo số sao (bấm một hàng để lọc), rồi danh sách đánh giá
 *   với hàng chip lọc (số sao, có ảnh / video — FilterChip dùng chung với bộ lọc Cửa hàng) và sắp xếp.
 * - Nút "Thêm đánh giá" mở hộp thoại (AppDialog chung) chứa form — ô nhập dùng TextField / TextAreaField chung;
 *   kiểm tra dữ liệu ngay trên form, gửi thành công thì đóng hộp thoại. Đóng giữa chừng vẫn giữ nội dung đang nhập.
 * - Đính kèm ảnh / video thực tế (MediaUploader chung). Chưa có API đánh giá nên tệp chỉ được xem trước ở trình duyệt.
 */
export default function ProductReviews({ locale }: ProductReviewsProps) {
  const t = useTranslations('Product.details');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [errors, setErrors] = useState<ReviewErrors>({});
  const [submitCount, setSubmitCount] = useState(0);

  // ---------- Bộ lọc & sắp xếp danh sách đánh giá ----------
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [mediaOnly, setMediaOnly] = useState(false);
  const [sortKey, setSortKey] = useState<ReviewSortKey>('newest');

  const countByStars = (stars: number) => productReviews.filter((review) => review.score === stars).length;
  const mediaCount = productReviews.filter((review) => review.media?.length).length;
  const hasFilter = starFilter !== null || mediaOnly;

  const visibleReviews = productReviews
    .filter((review) => (starFilter === null || review.score === starFilter) && (!mediaOnly || Boolean(review.media?.length)))
    .sort((a, b) => {
      if (sortKey === 'highest') return b.score - a.score || b.date.localeCompare(a.date);
      if (sortKey === 'lowest') return a.score - b.score || b.date.localeCompare(a.date);
      return b.date.localeCompare(a.date);
    });

  const clearReviewFilters = () => {
    setStarFilter(null);
    setMediaOnly(false);
  };

  const dateFormatter = new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: locale === 'vi' ? '2-digit' : 'short', year: 'numeric' });

  const validate = (): ReviewErrors => {
    const next: ReviewErrors = {};
    if (rating === 0) next.rating = t('ratingRequired');
    if (!name.trim()) next.name = t('nameRequired');
    if (!emailSchema.safeParse(email.trim()).success) next.email = t('emailInvalid');
    if (!content.trim()) next.content = t('reviewRequired');
    return next;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitCount((count) => count + 1);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    // Chưa có API đánh giá — báo đã nhận rồi làm trống form
    showToast.success(t('reviewSubmitted'), t('reviewSubmittedDesc'));
    setRating(0);
    setName('');
    setEmail('');
    setContent('');
    media.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    setMedia([]);
    setIsFormOpen(false);
  };

  /** Sửa ô nào thì xóa lỗi của ô đó ngay */
  const clearError = (field: keyof ReviewErrors) => setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));

  const scoreText = new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { minimumFractionDigits: 1 }).format(AVERAGE_SCORE);

  /* ---------- Form viết đánh giá ---------- */
  const reviewForm = (
      <form id={REVIEW_FORM_ID} noValidate onSubmit={handleSubmit} className="space-y-6">
        <div>
          <p id="review-rating-label" className="text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--text-light)]">
            {t('yourRating')}
          </p>
          <div className="mt-3">
            <Rating
              style={{ maxWidth: 150 }}
              value={rating}
              onChange={(value: number) => {
                setRating(value);
                clearError('rating');
              }}
              itemStyles={reviewRatingStyles}
              isRequired
              visibleLabelId="review-rating-label"
            />
          </div>
          {errors.rating ? (
            <p key={`rating-${submitCount}`} role="alert" className="mt-1.5 text-xs text-[var(--destructive)] motion-safe:animate-shake">
              {errors.rating}
            </p>
          ) : null}
        </div>

        <TextField
          label={t('nameLabel')}
          placeholder={t('namePlaceholder')}
          autoComplete="name"
          value={name}
          onValueChange={(value) => {
            setName(value);
            clearError('name');
          }}
          error={errors.name}
          shakeKey={submitCount}
        />

        <TextField
          type="email"
          label={t('emailLabel')}
          placeholder={t('emailPlaceholder')}
          autoComplete="email"
          value={email}
          onValueChange={(value) => {
            setEmail(value);
            clearError('email');
          }}
          error={errors.email}
          shakeKey={submitCount}
        />

        <TextAreaField
          label={t('reviewLabel')}
          placeholder={t('reviewPlaceholder')}
          rows={4}
          maxLength={REVIEW_MAX_LENGTH}
          showCount
          value={content}
          onValueChange={(value) => {
            setContent(value);
            clearError('content');
          }}
          error={errors.content}
        />

        <MediaUploader label={t('mediaLabel')} items={media} onItemsChange={setMedia} />
      </form>
  );

  return (
    <div className="min-w-0">
      <div className="min-w-0">
        {/* ---------- Tổng quan điểm ---------- */}
        <div className="grid gap-6 border-b border-[var(--border)] pb-8 sm:grid-cols-[auto_1fr] sm:items-center sm:gap-10">
          <div>
            <p className="font-[family-name:var(--font-playfair)] text-[3.25rem] font-semibold leading-none text-[var(--text-main)]">{scoreText}</p>
            <Rating style={{ maxWidth: 110 }} value={AVERAGE_SCORE} itemStyles={reviewRatingStyles} readOnly className="mt-3" />
            <p className="mt-2 text-xs text-[var(--text-light)]">{t('basedOn', { count: REVIEW_TOTAL })}</p>
          </div>

          {/* Bấm một hàng sao để lọc nhanh theo số sao đó (bấm lại để bỏ) */}
          <ul className="space-y-1" aria-label={t('customerReviewsTitle')}>
            {DISTRIBUTION.map(({ stars, percent }) => {
              const isActive = starFilter === stars;
              return (
                <li key={stars}>
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => setStarFilter(isActive ? null : stars)}
                    className={cn(
                      'grid w-full cursor-pointer grid-cols-[3.5rem_1fr_2.5rem] items-center gap-3 py-0.5 text-xs transition-colors',
                      isActive ? 'text-[var(--primary-ink)]' : 'text-[var(--text-light)] hover:text-[var(--text-main)]'
                    )}
                  >
                    <span className="text-left">{t('starsCount', { count: stars })}</span>
                    <span className="h-1.5 overflow-hidden bg-[var(--bg-secondary)]" aria-hidden="true">
                      <span className={cn('block h-full transition-colors', isActive ? 'bg-[var(--primary-color)]' : 'bg-[var(--sale-gold)]')} style={{ width: `${percent}%` }} />
                    </span>
                    <span className="text-right tabular-nums">{percent}%</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ---------- Nút mở hộp thoại viết đánh giá ---------- */}
        <div className="mt-6">
          <ActionButton variant="dialog" size="sm" icon={<PenLine size={15} strokeWidth={1.6} />} onClick={() => setIsFormOpen(true)}>
            {t('addReview')}
          </ActionButton>
        </div>
        <AppDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          icon={PenLine}
          title={t('addReview')}
          size="lg"
          confirm={{ label: t('submitReview'), form: REVIEW_FORM_ID }}
          cancel={{ label: t('replyCancel') }}
        >
          {reviewForm}
        </AppDialog>

        {/* ---------- Danh sách đánh giá: tiêu đề + sắp xếp, hàng chip lọc ---------- */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[var(--text-main)]">{t('customerReviewsTitle')}</h3>
          <Select
            value={sortKey}
            onValueChange={(value) => {
              if (value) setSortKey(value as ReviewSortKey);
            }}
          >
            <SelectTrigger
              aria-label={t('reviewSortLabel')}
              className="h-9 w-auto cursor-pointer gap-1.5 rounded-none border-0 bg-transparent px-0 text-sm shadow-none hover:bg-transparent focus-visible:ring-0 data-[popup-open]:bg-transparent"
            >
              <span className="text-[var(--text-light)]">{t('reviewSortLabel')}:</span>
              <SelectValue className="text-[var(--text-main)]">{(value: ReviewSortKey) => t(`reviewSort.${value}`)}</SelectValue>
            </SelectTrigger>
            <SelectContent align="end" className="w-48 rounded-none border border-[var(--border)] bg-[var(--bg-main)] text-[var(--text-main)] shadow-md">
              <SelectGroup>
                {REVIEW_SORT_KEYS.map((key) => (
                  <SelectItem key={key} value={key} className="cursor-pointer rounded-none">
                    {t(`reviewSort.${key}`)}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 flex flex-wrap gap-1.5" role="group" aria-label={t('reviewFilterLabel')}>
          <FilterChip label={t('reviewFilterAll')} count={productReviews.length} selected={!hasFilter} onToggle={clearReviewFilters} />
          {[5, 4, 3, 2, 1].map((stars) => (
            <FilterChip
              key={stars}
              label={`${stars} ★`}
              count={countByStars(stars)}
              selected={starFilter === stars}
              onToggle={() => setStarFilter(starFilter === stars ? null : stars)}
            />
          ))}
          <FilterChip
            label={t('reviewFilterMedia')}
            count={mediaCount}
            selected={mediaOnly}
            onToggle={() => setMediaOnly((value) => !value)}
            leading={<Camera size={13} strokeWidth={1.6} aria-hidden="true" />}
          />
        </div>

        {visibleReviews.length > 0 ? (
          <div className="mt-2 divide-y divide-[var(--border)]">
            {visibleReviews.map((review) => (
              <ReviewItem key={review.id} review={review} locale={locale} formatDate={(iso) => dateFormatter.format(new Date(iso))} />
            ))}
          </div>
        ) : (
          <div className="mt-6 border-y border-[var(--border)] py-12 text-center">
            <p className="font-[family-name:var(--font-playfair)] text-lg font-semibold text-[var(--text-main)]">{t('reviewEmptyTitle')}</p>
            <ActionButton variant="dialog" size="sm" onClick={clearReviewFilters} className="mt-5">
              {t('reviewFilterClear')}
            </ActionButton>
          </div>
        )}
      </div>
    </div>
  );
}
