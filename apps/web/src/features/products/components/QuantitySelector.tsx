'use client';

import { useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import Counter from '@/components/effects/Counter';

export default function QuantitySelector() {
  const [quantity, setQuantity] = useState(1);

  return (
    <div className="flex h-12 w-full rounded-[4px] items-center justify-between border border-[var(--border)] bg-[var(--bg-main)] px-4 sm:w-32">
      <button
        type="button"
        aria-label="Decrease quantity"
        className="cursor-pointer text-[var(--text-main)] hover:text-[var(--primary-color)] transition-colors p-1"
        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
      >
        <Minus size={16} />
      </button>
      <div className="flex items-center justify-center select-none text-[var(--text-main)] min-w-[2rem] text-center">
        <Counter
          value={quantity}
          fontSize={16}
          padding={2}
          textColor="var(--text-main)"
          gradientFrom="var(--bg-main)"
          gradientTo="transparent"
          gradientHeight={2}
          fontWeight="600"
          counterStyle={{ fontFamily: "var(--font-lora), 'Lora', serif" }}
        />
      </div>
      <button
        type="button"
        aria-label="Increase quantity"
        className="cursor-pointer text-[var(--text-main)] hover:text-[var(--primary-color)] transition-colors p-1"
        onClick={() => setQuantity((q) => q + 1)}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
