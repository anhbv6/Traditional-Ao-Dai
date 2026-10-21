import React from 'react';
import { TextField } from '@/components/shared/TextField';
import { AUTH_FIELD_PROPS } from '../authField';

interface PasswordLoginFormProps {
  emailOrPhone: string;
  setEmailOrPhone: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  disabled?: boolean;
  /** Lỗi nhập liệu hiển thị dưới từng ô */
  errors?: { emailOrPhone?: string; password?: string };
  /** Đổi giá trị để lỗi rung lại khi bấm Đăng nhập lần nữa */
  shakeKey?: number;
  t: (key: string) => string;
}

export function PasswordLoginForm({
  emailOrPhone,
  setEmailOrPhone,
  password,
  setPassword,
  disabled = false,
  errors = {},
  shakeKey,
  t,
}: PasswordLoginFormProps) {
  return (
    <>
      {/* Email or Phone Field */}
      <TextField
        {...AUTH_FIELD_PROPS}
        id="emailOrPhone"
        autoComplete="username"
        label={t('emailOrPhone')}
        placeholder={t('loginEmailOrPhonePlaceholder')}
        value={emailOrPhone}
        disabled={disabled}
        error={errors.emailOrPhone}
        shakeKey={shakeKey}
        onValueChange={setEmailOrPhone}
      />

      {/* Password Field */}
      <TextField
        {...AUTH_FIELD_PROPS}
        id="password"
        type="password"
        passwordToggle
        autoComplete="current-password"
        label={t('password')}
        placeholder={t('loginPasswordPlaceholder')}
        value={password}
        disabled={disabled}
        error={errors.password}
        shakeKey={shakeKey}
        onValueChange={setPassword}
      />
    </>
  );
}
export default PasswordLoginForm;
