import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  inputClassName?: string;
  isInvalid?: boolean;
}

export function OtpInput({
  value,
  onChange,
  length = 6,
  disabled = false,
  autoFocus = true,
  className,
  inputClassName,
  isInvalid = false,
}: OtpInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const otpArray = Array.from({ length }, (_, i) => value[i] || '');

  // Auto-focus the first input on mount if autoFocus is true
  useEffect(() => {
    if (autoFocus) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [autoFocus]);

  const handleChange = (val: string, idx: number) => {
    // Only accept numeric digits
    if (!/^\d*$/.test(val)) return;

    const newValue = [...otpArray];
    newValue[idx] = val.slice(-1);
    const combined = newValue.join('');
    onChange(combined);

    // Auto-focus next input
    if (val && idx < length - 1) {
      inputRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, idx: number) => {
    if (e.key === 'Backspace') {
      const newValue = [...otpArray];
      if (!otpArray[idx] && idx > 0) {
        // Clear previous input and focus it
        newValue[idx - 1] = '';
        onChange(newValue.join(''));
        inputRefs.current[idx - 1]?.focus();
      } else {
        // Clear current input
        newValue[idx] = '';
        onChange(newValue.join(''));
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(pastedData);
    
    if (pastedData.length > 0) {
      const focusIdx = Math.min(pastedData.length, length - 1);
      inputRefs.current[focusIdx]?.focus();
    }
  };

  return (
    <div className={cn('flex justify-between gap-1.5 sm:gap-3', className)}>
      {otpArray.map((digit, idx) => (
        <input
          key={idx}
          type="text"
          maxLength={1}
          value={digit}
          disabled={disabled}
          ref={(el) => {
            inputRefs.current[idx] = el;
          }}
          onChange={(e) => handleChange(e.target.value, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={idx === 0 ? handlePaste : undefined}
          className={cn(
            'w-[calc((100%-(length-1)*0.25rem)/length)] max-w-14 aspect-square sm:h-16 text-center text-lg sm:text-xl font-semibold rounded-lg border bg-background text-[var(--text-main)] shadow-none outline-none transition-all focus:bg-white focus:ring-2 focus:ring-[var(--ring)]/30 disabled:opacity-50 disabled:pointer-events-none',
            isInvalid
              ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-[var(--border)] focus:border-[var(--primary-color)]',
            inputClassName
          )}
          style={{
            width: `calc((100% - ${(length - 1) * 0.3}rem) / ${length})`,
          }}
        />
      ))}
    </div>
  );
}
