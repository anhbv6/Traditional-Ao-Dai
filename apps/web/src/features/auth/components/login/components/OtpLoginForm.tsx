import React from 'react';
import { motion } from 'motion/react';
import { ActionButton } from '@/components/shared/ActionButton';
import { TextField } from '@/components/shared/TextField';
import { AuthOtpField } from '../../AuthOtpField';
import { AUTH_FIELD_PROPS, sanitizePhoneChange } from '../../authField';

interface OtpLoginFormProps {
  phone: string;
  setPhone: (val: string) => void;
  otpSent: boolean;
  otpValue: string;
  setOtpValue: (val: string) => void;
  /** Lỗi ô SĐT (trống / sai định dạng) */
  phoneError?: string;
  otpError: string;
  /** Đổi giá trị để lỗi rung lại khi bấm lần nữa */
  shakeKey?: number;
  /** Gửi lại mã (LoginForm kiểm tra SĐT trước khi gọi API) */
  onSendOtp: () => void;
  isSendingOtp: boolean;
  /** Số giây còn lại trước khi được gửi lại mã */
  resendSeconds: number;
  disabled?: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export function OtpLoginForm({
  phone,
  setPhone,
  otpSent,
  otpValue,
  setOtpValue,
  phoneError,
  otpError,
  shakeKey,
  onSendOtp,
  isSendingOtp,
  resendSeconds,
  disabled = false,
  t,
}: OtpLoginFormProps) {
  const canSend = !!phone.trim() && !disabled && resendSeconds === 0;

  // Nút gửi lại mã trong ô SĐT — chỉ hiện khi đã gửi lần đầu (lần đầu dùng nút chính bên dưới)
  const resendButton = otpSent ? (
    <ActionButton
      variant="dialog"
      size="sm"
      disabled={!canSend}
      loading={isSendingOtp}
      onClick={onSendOtp}
      className="-mr-1.5 tabular-nums"
    >
      {resendSeconds > 0 ? t('resendShort', { timer: resendSeconds }) : t('resendOtp')}
    </ActionButton>
  ) : undefined;

  return (
    <>
      {/* Phone OTP Field */}
      <TextField
        {...AUTH_FIELD_PROPS}
        id="phone"
        type="tel"
        autoComplete="tel"
        label={t('phone')}
        placeholder={t('loginPhonePlaceholder')}
        value={phone}
        disabled={disabled}
        onChange={sanitizePhoneChange((e) => setPhone(e.target.value))}
        suffix={resendButton}
        error={phoneError}
        shakeKey={shakeKey}
      />

      {/* 6-digit OTP inputs block */}
      {otpSent && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <AuthOtpField
            label={t('otpCode')}
            value={otpValue}
            onChange={setOtpValue}
            error={otpError || undefined}
            disabled={disabled}
          />
        </motion.div>
      )}
    </>
  );
}
export default OtpLoginForm;
