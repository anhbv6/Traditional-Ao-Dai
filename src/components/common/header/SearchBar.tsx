'use client';

import { FormEvent, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

type SearchBarProps = {
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  compact?: boolean;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
};

export function SearchBar({
  value,
  defaultValue = '',
  placeholder = 'Default',
  compact = true,
  onChange,
  onSearch,
}: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);
  const searchValue = value ?? internalValue;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch?.(searchValue.trim());
  };

  const handleChange = (nextValue: string) => {
    if (value === undefined) {
      setInternalValue(nextValue);
    }

    onChange?.(nextValue);
  };

  if (compact) {
    return (
      <form
        role="search"
        onSubmit={handleSubmit}
        className="relative hidden h-11 w-11 place-items-center xl:grid"
      >
        <label className="sr-only" htmlFor="site-search-compact">
          {placeholder}
        </label>
        <Search
          size={22}
          strokeWidth={1.5}
          className="text-[#800020] transition-opacity hover:opacity-75"
          aria-hidden="true"
        />
        <button className="absolute inset-0" type="submit" aria-label={placeholder} />
      </form>
    );
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="relative w-full pt-1.5">
      {/* Outer Input Box with Floating Notch Label */}
      <div className="group h-10 gap-2 relative flex items-center rounded-xl border border-[#E2D9D2] bg-white px-3.5 py-3 shadow-2xs transition-colors focus-within:border-[#800020] focus-within:ring-1 focus-within:ring-[#800020]">
        {/* Left Search Icon */}
        <Search
          size={18}
          strokeWidth={1.8}
          className="mr-3 text-[#800020] shrink-0"
          aria-hidden="true"
        />

        {/* Input Text Field */}
        <input
          id="site-search-drawer"
          type="text"
          value={searchValue}
          onChange={(event) => handleChange(event.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-sm text-[#2A2525] placeholder:text-[#706565]/60 outline-none font-[family-name:var(--font-lora)]"
        />
      </div>
    </form>
  );
}
