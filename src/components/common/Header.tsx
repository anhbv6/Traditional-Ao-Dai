'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/routing';
import { useTransition } from 'react';

export default function Header() {
  const t = useTranslations('Common');
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSwitchLanguage = () => {
    const nextLocale = locale === 'vi' ? 'en' : 'vi';
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return (
    <header className="flex justify-between items-center p-4 border-b bg-white/80 backdrop-blur shadow-sm">
      <nav className="flex gap-6 items-center">
        <Link href="/" className="font-semibold text-gray-800 hover:text-[var(--primary-color)] transition">
          {t('home')}
        </Link>
        <Link href="/products" className="font-semibold text-gray-800 hover:text-[var(--primary-color)] transition">
          {t('products')}
        </Link>
        <Link href="/cart" className="font-semibold text-gray-800 hover:text-[var(--primary-color)] transition">
          {t('cart')}
        </Link>
      </nav>

      <button
        onClick={handleSwitchLanguage}
        disabled={isPending}
        className="button-action !py-2 !px-4 text-xs rounded transition opacity-90 hover:opacity-100 disabled:opacity-50"
      >
        {t('switchLang')}
      </button>
    </header>
  );
}