'use client';

import { useOptimistic, useTransition } from 'react';
import { motion } from 'motion/react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter, routing } from '@/i18n/routing';
import { cn } from '@/lib/utils';

/**
 * Chọn ngôn ngữ dạng nút gạt "VI | EN" (thay cho dropdown) — thấy ngay ngôn ngữ hiện tại, đổi chỉ một chạm.
 * Khối nền đỏ đô trượt sang ngôn ngữ vừa chọn NGAY khi bấm (useOptimistic), không chờ trang tải lại.
 * Vuông góc, viền mảnh — đồng bộ với các nút / ô nhập khác của storefront.
 */
export function LanguageSwitcher() {
  const t = useTranslations('Common');
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedLocale, setSelectedLocale] = useOptimistic(currentLocale);

  const handleSelect = (locale: string) => {
    if (locale === selectedLocale || isPending) return;
    startTransition(() => {
      setSelectedLocale(locale);
      router.replace(pathname, { locale });
    });
  };

  return (
    <div
      role="group"
      aria-label={t('language')}
      aria-busy={isPending || undefined}
      className="relative flex h-9 items-center border border-[var(--border)] bg-[var(--bg-card)]/60 p-[3px]"
    >
      {routing.locales.map((locale) => {
        const isActive = locale === selectedLocale;
        return (
          <button
            key={locale}
            type="button"
            lang={locale}
            onClick={() => handleSelect(locale)}
            aria-pressed={isActive}
            className={cn(
              'relative h-full min-w-9 cursor-pointer px-2.5 text-[11px] font-semibold uppercase tracking-[1.5px] transition-colors duration-300',
              isActive ? 'text-white' : 'text-[var(--text-light)] hover:text-[var(--primary-ink)]',
            )}
          >
            {isActive ? (
              <motion.span
                layoutId="language-switcher-indicator"
                aria-hidden="true"
                className="absolute inset-0 bg-[var(--primary-color)]"
                transition={{ type: 'spring', stiffness: 420, damping: 34 }}
              />
            ) : null}
            <span className="relative">{locale}</span>
          </button>
        );
      })}
    </div>
  );
}
