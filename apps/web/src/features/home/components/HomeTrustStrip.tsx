import React from 'react';
import { useTranslations } from 'next-intl';
import { Feather, Gift, Ruler, Scissors } from 'lucide-react';

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
    <section className="border-y border-[var(--border)] bg-white">
      <ul className="mx-auto grid max-w-[1440px] grid-cols-2 px-5 sm:px-8 lg:grid-cols-4 lg:px-10 xl:px-16">
        {TRUST_ITEMS.map(({ key, Icon }) => (
          <li
            key={key}
            className="flex items-center gap-4 border-[var(--border)] py-6 max-lg:[&:nth-child(-n+2)]:border-b lg:justify-center lg:border-r lg:last:border-r-0 lg:px-6"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-[var(--accent-color)]/60 text-[var(--primary-color)]">
              <Icon size={18} strokeWidth={1.4} />
            </span>
            <span className="min-w-0">
              <span className="block font-[family-name:var(--font-playfair)] text-[15px] font-semibold leading-snug text-[var(--primary-color)]">
                {t(`${key}.title`)}
              </span>
              <span className="block text-xs leading-5 text-[var(--text-light)]">{t(`${key}.desc`)}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
