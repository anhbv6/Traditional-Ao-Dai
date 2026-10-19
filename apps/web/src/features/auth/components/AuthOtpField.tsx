import React from 'react';
import { AlertCircle } from 'lucide-react';
import { OtpInput } from '@/components/shared/OtpInput';

interface AuthOtpFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  /** Đổi giá trị để lỗi rung lại khi bấm lần nữa */
  shakeKey?: string | number;
  /** Nhãn phía trên (kiểu chữ giống nhãn TextField) */
  label?: string;
}

/** Ô nhập 6 số OTP của form auth — OtpInput khung vuông + nhãn + thông báo lỗi giống TextField */
export function AuthOtpField({ value, onChange, error, disabled = false, shakeKey, label }: AuthOtpFieldProps) {
  return (
    <div className="space-y-2">
      {label && (
        <p className="text-[11px] font-semibold uppercase tracking-[2.5px] text-[var(--text-light)]">{label}</p>
      )}
      <OtpInput
        value={value}
        onChange={onChange}
        isInvalid={!!error}
        disabled={disabled}
        inputClassName="rounded-none"
      />
      {error && (
        <p key={`${error}:${shakeKey ?? ''}`} role="alert" className="flex items-start gap-1.5 text-xs leading-5 text-rose-500 motion-safe:animate-shake">
          <AlertCircle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

export default AuthOtpField;
