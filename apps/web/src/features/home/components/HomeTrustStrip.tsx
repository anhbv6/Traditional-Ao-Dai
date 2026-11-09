import React from 'react';
import { useTranslations } from 'next-intl';
import { Feather, Gift, Ruler, Scissors } from 'lucide-react';
import { containerClassName } from '@/components/layout/Container';

const TRUST_ITEMS = [
  { key: 'silk', Icon: Feather },
  { key: 'embroidery', Icon: Scissors },
  { key: 'tailoring', Icon: Ruler },
  { key: 'delivery', Icon: Gift },
] as const;

/** Dải cam kết ngay dưới hero — trả lời nhanh "vì sao nên tin" trước khi khách xem sản phẩm */
export function HomeTrustStrip() {
  const t = useTranslations('HomePage.trust');

  return (
    <section className="border-y border-[var(--border)] bg-[var(--bg-card)]">
      <ul className={containerClassName({ className: 'grid grid-cols-2 lg:grid-cols-4' })}>
        {TRUST_ITEMS.map(({ key, Icon }) => (
          <li
            key={key}
            className="flex items-center gap-3 border-[var(--border)] py-4 max-lg:even:pl-3 max-lg:odd:pr-2 max-lg:[&:nth-child(-n+2)]:border-b sm:gap-4 sm:py-6 lg:justify-center lg:border-r lg:last:border-r-0 lg:px-6"
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full sm:size-11 border border-[var(--accent-color)]/60 text-[var(--primary-ink)]">
              <Icon className="size-4 sm:size-[18px]" strokeWidth={1.4} />
            </span>
            <span className="min-w-0">
              <span className="block font-[family-name:var(--font-playfair)] text-[13px] font-semibold leading-snug sm:text-[15px] text-[var(--primary-ink)]">
                {t(`${key}.title`)}
              </span>
              <span className="mt-0.5 block text-[11px] leading-4 text-[var(--text-light)] sm:text-xs sm:leading-5">{t(`${key}.desc`)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
