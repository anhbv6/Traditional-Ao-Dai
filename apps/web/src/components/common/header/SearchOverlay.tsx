'use client';

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { useLenis } from 'lenis/react';
import { ArrowRight, Clock3, Search, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { type Locale } from '@repo/shared';
import {
  MIN_SEARCH_LENGTH,
  getHighlightParts,
  productCatalog,
  searchProducts,
  useSearchHistoryStore,
  type MockProduct,
} from '@/features/products';
import { Link, useRouter } from '@/i18n/routing';

const EASE = [0.22, 1, 0.36, 1] as const;
const MAX_SUGGESTIONS = 6;

type SearchOverlayProps = {
  label: string;
  placeholder: string;
};

/** Tô đậm phần khớp từ khóa (không phân biệt dấu) */
function Highlight({ text, query }: { text: string; query: string }) {
  return (
    <>
      {getHighlightParts(text, query).map((part, index) =>
        part.match ? (
          <mark key={index} className="bg-transparent font-semibold text-[var(--primary-color)]">
            {part.text}
          </mark>
        ) : (
          <React.Fragment key={index}>{part.text}</React.Fragment>
        )
      )}
    </>
  );
}

/**
 * Tìm kiếm trên header: nút kính lúp (mọi kích thước màn hình) + phím tắt `/` hoặc Ctrl/⌘+K mở bảng phủ đầu trang.
 * - Chưa gõ: tìm kiếm gần đây (lưu trên trình duyệt) + từ khóa phổ biến.
 * - Đang gõ (≥ 2 ký tự): gợi ý sản phẩm tức thì, không phân biệt dấu, tô đậm phần khớp; ↑/↓ chọn, Enter mở.
 * - Enter khi chưa chọn gợi ý / "Xem tất cả": sang `/products?q=` (trang sản phẩm dùng cùng bộ so khớp).
 */
export function SearchOverlay({ label, placeholder }: SearchOverlayProps) {
  const t = useTranslations('Common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const lenis = useLenis();
  const listboxId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  // Chỉ gắn portal sau lần mở đầu tiên (server và lần hydrate đầu đều không có portal -> không lệch hydration)
  const [hasOpened, setHasOpened] = useState(false);
  const openPanel = () => {
    setHasOpened(true);
    setOpen(true);
  };
  const [query, setQuery] = useState('');
  // Lọc đồng bộ theo từ khóa đang gõ (danh mục nhỏ, lọc rất nhẹ) -> phím ↑/↓ luôn khớp với danh sách đang hiện
  const trimmed = query.trim();
  const canSuggest = trimmed.length >= MIN_SEARCH_LENGTH;

  // Mục đang chọn bằng bàn phím gắn với từ khóa: đổi từ khóa thì tự bỏ chọn, không cần effect đồng bộ
  const [active, setActive] = useState({ query: '', index: -1 });

  const history = useSearchHistoryStore((state) => state.queries);
  const { add: addHistory, remove: removeHistory, clear: clearHistory } = useSearchHistoryStore.getState();
  const keywords = t.raw('searchPanel.keywords') as string[];

  const matches = useMemo(
    () => (canSuggest ? searchProducts(productCatalog, trimmed, locale) : []),
    [canSuggest, trimmed, locale]
  );
  // Dữ liệu mock lặp lại cùng tên ở nhiều trang -> gợi ý chỉ lấy mỗi tên một lần cho dễ nhìn
  const suggestions = useMemo(() => {
    const seen = new Set<string>();
    const result: MockProduct[] = [];
    for (const product of matches) {
      if (seen.has(product.name[locale])) continue;
      seen.add(product.name[locale]);
      result.push(product);
      if (result.length === MAX_SUGGESTIONS) break;
    }
    return result;
  }, [matches, locale]);
  const activeIndex = active.query === trimmed && active.index < suggestions.length ? active.index : -1;

  const close = () => {
    setOpen(false);
    setQuery('');
    triggerRef.current?.focus();
  };

  // Phím tắt mở bảng: `/` (khi không đang gõ ở ô khác) hoặc Ctrl/⌘ + K
  useEffect(() => {
    if (open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      // target có thể là window/document (không phải Element) -> coi như không đang gõ
      const target = event.target;
      const isTyping = target instanceof Element && Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
      const isShortcut = (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !isTyping);
      if (!isShortcut) return;
      event.preventDefault();
      setHasOpened(true);
      setOpen(true);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]);

  // Khóa cuộn trang phía sau khi bảng mở (cả Lenis smooth-scroll)
  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add('is-scroll-locked');
    lenis?.stop();
    return () => {
      document.documentElement.classList.remove('is-scroll-locked');
      lenis?.start();
    };
  }, [open, lenis]);

  const goToResults = (value: string) => {
    const keyword = value.trim();
    if (!keyword) return;
    addHistory(keyword);
    close();
    router.push(`/products?q=${encodeURIComponent(keyword)}#product-list`);
  };

  const openProduct = (product: MockProduct) => {
    addHistory(trimmed);
    close();
    router.push(`/products/${product.id}`);
  };

  /** Chọn từ khóa gợi ý / gần đây: điền vào ô để xem gợi ý ngay, khách bấm Enter để xem toàn bộ */
  const fillQuery = (value: string) => {
    setQuery(value);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const step = event.key === 'ArrowDown' ? 1 : -1;
      const next = (activeIndex + step + suggestions.length + 1) % (suggestions.length + 1);
      // Vị trí cuối cùng (= suggestions.length) nghĩa là quay về ô nhập (không chọn gì)
      setActive({ query: trimmed, index: next === suggestions.length ? -1 : next });
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (activeIndex >= 0 && suggestions[activeIndex]) {
      openProduct(suggestions[activeIndex]);
      return;
    }
    goToResults(query);
  };

  const keywordChips = (
    <ul className="flex flex-wrap gap-2">
      {keywords.map((keyword) => (
        <li key={keyword}>
          <button
            type="button"
            onClick={() => fillQuery(keyword)}
            className="cursor-pointer border border-[var(--border)] bg-white px-3 py-1.5 text-[12px] text-[var(--text-main)] transition-colors duration-300 hover:border-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white"
          >
            {keyword}
          </button>
        </li>
      ))}
    </ul>
  );

  const sectionTitle = 'mb-3 text-[10px] uppercase tracking-[2px] text-[var(--text-light)]';

  const panel = (
    <MotionConfig reducedMotion="user">
      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              key="search-backdrop"
              aria-hidden="true"
              onClick={close}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 z-[80] bg-[#2A2525]/45 backdrop-blur-[2px]"
            />
            <motion.div
              key="search-panel"
              role="dialog"
              aria-modal="true"
              aria-label={label}
              onKeyDown={(event) => {
                // Esc đóng bảng dù focus đang ở ô nhập hay ở nút bên trong
                if (event.key === 'Escape') {
                  event.preventDefault();
                  close();
                }
              }}
              // Trượt bằng transform (không dùng clip-path: trình duyệt rút gọn `inset()` khiến hiệu ứng thoát không kết thúc)
              initial={{ y: '-100%' }}
              animate={{ y: 0 }}
              exit={{ y: '-100%', transition: { duration: 0.35, ease: EASE } }}
              transition={{ duration: 0.55, ease: EASE }}
              className="fixed inset-x-0 top-0 z-[81] flex max-h-[88dvh] flex-col border-b border-[var(--border)] bg-[var(--bg-main)] font-[family-name:var(--font-lora)] text-[var(--text-main)] shadow-[0_24px_48px_-24px_rgba(42,37,37,0.35)]"
            >
              <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-col px-5 sm:px-8">
                {/* Ô nhập */}
                <form role="search" onSubmit={handleSubmit} className="group/input relative flex items-center gap-3 py-4 sm:py-6">
                  <Search size={20} strokeWidth={1.5} className="shrink-0 text-[var(--primary-color)]" aria-hidden="true" />
                  <input
                    ref={inputRef}
                    autoFocus
                    type="text"
                    role="combobox"
                    aria-expanded={suggestions.length > 0}
                    aria-controls={listboxId}
                    aria-autocomplete="list"
                    aria-activedescendant={activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
                    aria-label={label}
                    value={query}
                    maxLength={100}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    autoComplete="off"
                    spellCheck={false}
                    className="min-w-0 flex-1 bg-transparent font-[family-name:var(--font-playfair)] text-lg text-[var(--text-main)] outline-none placeholder:text-[var(--text-light)]/50 sm:text-2xl"
                  />
                  <AnimatePresence>
                    {query ? (
                      <motion.button
                        type="button"
                        onClick={() => fillQuery('')}
                        initial={{ opacity: 0, scale: 0.6 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.6 }}
                        className="shrink-0 cursor-pointer px-1 text-[10px] uppercase tracking-[1.5px] text-[var(--text-light)] transition-colors hover:text-[var(--primary-color)]"
                      >
                        {t('searchPanel.clear')}
                      </motion.button>
                    ) : null}
                  </AnimatePresence>
                  <button
                    type="button"
                    onClick={close}
                    aria-label={t('searchPanel.close')}
                    className="grid size-9 shrink-0 cursor-pointer place-items-center border border-[var(--border)] text-[var(--text-main)] transition-colors hover:border-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white"
                  >
                    <X size={16} strokeWidth={1.6} />
                  </button>
                  {/* Gạch chân: vạch đỏ đô chạy ra khi ô nhập được focus */}
                  <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-[var(--border)]" />
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-0 bottom-0 h-px origin-left scale-x-0 bg-[var(--primary-color)] transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-focus-within/input:scale-x-100"
                  />
                </form>

                {/* Nội dung */}
                <div data-lenis-prevent className="min-h-0 overflow-y-auto overscroll-contain py-5 sm:py-6">
                  {!canSuggest ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.15, ease: EASE }}
                      className="grid gap-7 md:grid-cols-2 md:gap-10"
                    >
                      {trimmed.length > 0 ? (
                        <p className="text-[12px] text-[var(--text-light)] md:col-span-2">
                          {t('searchPanel.minChars', { min: MIN_SEARCH_LENGTH })}
                        </p>
                      ) : null}
                      {history.length > 0 ? (
                        <section>
                          <div className="flex items-baseline justify-between">
                            <h2 className={sectionTitle}>{t('searchPanel.recent')}</h2>
                            <button
                              type="button"
                              onClick={clearHistory}
                              className="cursor-pointer text-[10px] uppercase tracking-[1.5px] text-[var(--text-light)] transition-colors hover:text-[var(--destructive)]"
                            >
                              {t('searchPanel.clearRecent')}
                            </button>
                          </div>
                          <ul>
                            {history.map((item) => (
                              <li key={item} className="group flex items-center border-b border-[var(--border)]/70">
                                <button
                                  type="button"
                                  onClick={() => fillQuery(item)}
                                  className="flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 py-2.5 text-left text-[13px] transition-colors hover:text-[var(--primary-color)]"
                                >
                                  <Clock3 size={13} strokeWidth={1.6} className="shrink-0 text-[var(--text-light)]" />
                                  <span className="truncate">{item}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeHistory(item)}
                                  aria-label={t('searchPanel.removeRecent', { query: item })}
                                  className="grid size-7 shrink-0 cursor-pointer place-items-center text-[var(--text-light)] transition-[opacity,color] hover:text-[var(--destructive)] lg:opacity-0 lg:group-hover:opacity-100 lg:focus-visible:opacity-100"
                                >
                                  <X size={12} />
                                </button>
                              </li>
                            ))}
                          </ul>
                        </section>
                      ) : null}
                      <section>
                        <h2 className={sectionTitle}>{t('searchPanel.popular')}</h2>
                        {keywordChips}
                      </section>
                    </motion.div>
                  ) : suggestions.length === 0 ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                      <div>
                        <p className="font-[family-name:var(--font-playfair)] text-base font-semibold">
                          {t('searchPanel.noResults', { query: trimmed })}
                        </p>
                        <p className="mt-1 text-[12px] text-[var(--text-light)]">{t('searchPanel.noResultsHint')}</p>
                      </div>
                      {keywordChips}
                    </motion.div>
                  ) : (
                    <section>
                      <h2 className={sectionTitle}>{t('searchPanel.results')}</h2>
                      <ul id={listboxId} role="listbox" aria-label={t('searchPanel.results')} className="grid gap-x-6 sm:grid-cols-2">
                        {suggestions.map((product, index) => {
                          const isActive = index === activeIndex;
                          return (
                            <motion.li
                              key={product.id}
                              id={`${listboxId}-${index}`}
                              role="option"
                              aria-selected={isActive}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.4, delay: index * 0.04, ease: EASE }}
                              className="border-b border-[var(--border)]/70"
                            >
                              <Link
                                href={`/products/${product.id}`}
                                onClick={() => {
                                  addHistory(trimmed);
                                  close();
                                }}
                                onMouseEnter={() => setActive({ query: trimmed, index })}
                                tabIndex={-1}
                                className={`flex items-center gap-3 px-2 py-2.5 transition-colors duration-200 ${
                                  isActive ? 'bg-[var(--bg-secondary)]' : ''
                                }`}
                              >
                                <span className="relative aspect-[3/4] w-11 shrink-0 overflow-hidden bg-[var(--bg-secondary)]">
                                  <Image src={product.imageSrc} alt="" fill sizes="44px" className="object-cover" />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate font-[family-name:var(--font-playfair)] text-[14px] text-[var(--text-main)]">
                                    <Highlight text={product.name[locale]} query={trimmed} />
                                  </span>
                                  <span className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-[var(--text-light)]">
                                    {product.purchaseType === 'custom' ? (
                                      <span className="bg-[var(--primary-color)] px-1 text-[9px] uppercase tracking-[1px] text-white">
                                        {t('searchPanel.custom')}
                                      </span>
                                    ) : null}
                                    <Highlight text={`${product.material} · ${product.category}`} query={trimmed} />
                                  </span>
                                </span>
                                <span className="shrink-0 text-[12px] font-semibold text-[var(--primary-color)]">
                                  {product.price[locale]}
                                </span>
                              </Link>
                            </motion.li>
                          );
                        })}
                      </ul>
                      <button
                        type="button"
                        onClick={() => goToResults(trimmed)}
                        className="group/all relative mt-5 flex min-h-10 w-full cursor-pointer items-center justify-center gap-2 overflow-hidden border border-[var(--primary-color)] text-[11px] font-semibold uppercase tracking-[2px] text-[var(--primary-color)] transition-colors duration-500 hover:text-white"
                      >
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 origin-left scale-x-0 bg-[var(--primary-color)] transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/all:scale-x-100"
                        />
                        <span className="relative flex items-center gap-2">
                          {t('searchPanel.viewAll', { count: matches.length })}
                          <ArrowRight size={14} className="transition-transform duration-300 group-hover/all:translate-x-1" />
                        </span>
                      </button>
                    </section>
                  )}
                </div>

                {/* Gợi ý phím tắt (desktop) */}
                <div className="hidden items-center gap-4 border-t border-[var(--border)] py-2.5 text-[10px] uppercase tracking-[1.5px] text-[var(--text-light)] md:flex">
                  <span><kbd className="border border-[var(--border)] bg-white px-1 font-sans">↑</kbd> <kbd className="border border-[var(--border)] bg-white px-1 font-sans">↓</kbd> {t('searchPanel.hintNavigate')}</span>
                  <span><kbd className="border border-[var(--border)] bg-white px-1 font-sans">Enter</kbd> {t('searchPanel.hintOpen')}</span>
                  <span><kbd className="border border-[var(--border)] bg-white px-1 font-sans">Esc</kbd> {t('searchPanel.hintClose')}</span>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </MotionConfig>
  );

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openPanel}
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={`${label} ( / )`}
        className="grid h-11 w-11 cursor-pointer place-items-center text-primary transition-opacity hover:opacity-75"
      >
        <Search size={22} strokeWidth={1.5} aria-hidden="true" />
      </button>
      {/* Portal ra body: tránh bị giới hạn bởi stacking context của header dính */}
      {hasOpened ? createPortal(panel, document.body) : null}
    </>
  );
}
