'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter, routing } from '@/i18n/routing';
import { useState, useTransition, useRef, useEffect } from 'react';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const currentLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSelectLanguage = (newLocale: string) => {
    if (newLocale === currentLocale || isPending) return;
    setIsOpen(false);
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  // Tự động đóng dropdown khi click ra bên ngoài (trên cả mobile & desktop)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const locales = routing.locales;

  return (
    <div
      ref={containerRef}
      className="group relative inline-block"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Nút bấm hiển thị ngôn ngữ hiện tại (hỗ trợ cả Hover trên PC và Click/Tap trên Mobile) */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        disabled={isPending}
        className="min-w-[70px] cursor-pointer flex h-9 items-center justify-center gap-1 rounded-xl border border-border bg-background px-2.5 text-[11px] font-bold uppercase tracking-wider text-primary shadow-2xs transition-colors hover:border-primary/50"
        aria-label={`Current language: ${currentLocale.toUpperCase()}`}
        aria-expanded={isOpen}
      >
        <Globe size={13} strokeWidth={1.5} className="text-primary" />
        {currentLocale.toUpperCase()}
      </button>

      {/* Tooltip Dropdown: Căn phải trên Mobile chống tràn màn hình, căn giữa trên PC */}
      <div
        className={[
          'absolute right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 top-full pt-2 z-50 transition-all duration-200 ease-out',
          isOpen
            ? 'visible opacity-100 translate-y-0'
            : 'invisible opacity-0 -translate-y-1 pointer-events-none',
        ].join(' ')}
      >
        <div className="relative flex flex-col gap-1 rounded-xl border border-border bg-background p-1.5 shadow-lg min-w-[84px]">
          {/* Mũi tên nhọn arrow tương thích responsive */}
          <div
            className="absolute -top-1.5 right-3 sm:left-1/2 sm:right-auto h-3 w-3 sm:-translate-x-1/2 rotate-45 border-l border-t border-border bg-background"
            aria-hidden="true"
          />

          {locales.map((loc) => {
            const isSelected = loc === currentLocale;

            return (
              <button
                key={loc}
                type="button"
                onClick={() => handleSelectLanguage(loc)}
                disabled={isPending}
                className={[
                  'cursor-pointer relative z-10 flex h-8 items-center justify-center rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-colors duration-150 px-3',
                  isSelected
                    ? 'bg-white border-primary text-primary shadow-2xs'
                    : 'border-transparent text-muted-foreground hover:bg-white hover:text-primary hover:border-border',
                ].join(' ')}
              >
                {loc.toUpperCase()}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
