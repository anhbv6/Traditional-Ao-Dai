'use client';

import { FormEvent, useState } from 'react';
import { ArrowRight, Search } from 'lucide-react';

type SearchBarProps = {
  placeholder?: string;
  submitLabel?: string;
  onSearch: (value: string) => void;
};

/** Ô tìm kiếm trong menu mobile — Enter / nút mũi tên để sang trang kết quả (bỏ qua khi chưa nhập gì) */
export function SearchBar({ placeholder = 'Search...', submitLabel = 'Search', onSearch }: SearchBarProps) {
  const [value, setValue] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const keyword = value.trim();
    if (keyword) onSearch(keyword);
  };

  return (
    <form role="search" onSubmit={handleSubmit} className="group relative flex w-full items-center border border-border bg-white transition-colors focus-within:border-primary">
      <Search size={16} strokeWidth={1.6} className="pointer-events-none ml-3.5 shrink-0 text-primary" aria-hidden="true" />
      <input
        type="search"
        value={value}
        maxLength={100}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-11 min-w-0 flex-1 bg-transparent px-3 font-[family-name:var(--font-lora)] text-sm text-foreground outline-none placeholder:text-muted-foreground/60 [&::-webkit-search-cancel-button]:hidden"
      />
      <button
        type="submit"
        aria-label={submitLabel}
        disabled={!value.trim()}
        className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center bg-primary text-white transition-opacity disabled:cursor-default disabled:opacity-30"
      >
        <ArrowRight size={16} />
      </button>
    </form>
  );
}
