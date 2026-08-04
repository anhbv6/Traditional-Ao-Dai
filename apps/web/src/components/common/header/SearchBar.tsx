'use client';

import { FormEvent, useState } from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

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
          className="text-primary transition-opacity hover:opacity-75"
          aria-hidden="true"
        />
        <button className="absolute inset-0" type="submit" aria-label={placeholder} />
      </form>
    );
  }

  return (
    <form role="search" onSubmit={handleSubmit} className="relative w-full">
      <Search
        size={18}
        strokeWidth={1.8}
        className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-[35%] text-primary"
        aria-hidden="true"
      />
      <Input
        id="site-search-drawer"
        type="text"
        value={searchValue}
        onChange={(event) => handleChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 rounded-xl border-border bg-white pl-11 pr-4 font-[family-name:var(--font-lora)] placeholder:text-muted-foreground/60"
      />
    </form>
  );
}
