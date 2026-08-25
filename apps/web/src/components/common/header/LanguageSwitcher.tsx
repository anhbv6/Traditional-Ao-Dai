'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter, routing } from '@/i18n/routing';
import { useTransition } from 'react';
import { Globe } from 'lucide-react';
import { Dropdown } from '@/components/shared';

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSelectLanguage = (newLocale: string, close: () => void) => {
    close();
    if (newLocale === currentLocale || isPending) return;

    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  const locales = routing.locales;

  return (
    <Dropdown
      contentClassName="flex min-w-24 flex-col gap-1"
      trigger={({ open, toggle }) => (
        <button
          type="button"
          onClick={toggle}
          disabled={isPending}
          className="flex h-9 min-w-16 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-3 text-xs font-semibold text-primary transition-colors hover:bg-secondary disabled:opacity-60"
          aria-label={`Current language: ${currentLocale.toUpperCase()}`}
          aria-expanded={open}
        >
          <Globe size={13} strokeWidth={1.5} className="text-primary" />
          {currentLocale.toUpperCase()}
        </button>
      )}
    >
      {({ close }) => (
        <>
          {locales.map((loc) => {
            const isSelected = loc === currentLocale;

            return (
              <button
                key={loc}
                type="button"
                onClick={() => handleSelectLanguage(loc, close)}
                disabled={isPending}
                className={[
                  'relative z-10 flex h-8 cursor-pointer items-center justify-center rounded-md px-3 text-xs font-semibold uppercase transition-colors disabled:opacity-60',
                  isSelected
                    ? 'bg-secondary text-primary'
                    : 'text-muted-foreground hover:bg-secondary hover:text-primary',
                ].join(' ')}
              >
                {loc.toUpperCase()}
              </button>
            );
          })}
        </>
      )}
    </Dropdown>
  );
}
