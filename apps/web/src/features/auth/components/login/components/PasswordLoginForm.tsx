import React from 'react';
import { FormInput } from '@/components/shared/FormInput';

interface PasswordLoginFormProps {
  emailOrPhone: string;
  setEmailOrPhone: (val: string) => void;
  password: string;
  setPassword: (val: string) => void;
  t: (key: string) => string;
}

export function PasswordLoginForm({
  emailOrPhone,
  setEmailOrPhone,
  password,
  setPassword,
  t,
}: PasswordLoginFormProps) {
  return (
    <>
      {/* Email or Phone Field */}
      <FormInput
        id="emailOrPhone"
        type="text"
        required
        label={t('emailOrPhone')}
        placeholder={t('loginEmailOrPhonePlaceholder')}
        value={emailOrPhone}
        onChange={(e) => setEmailOrPhone(e.target.value)}
      />

      {/* Password Field */}
      <FormInput
        id="password"
        type="password"
        required
        label={t('password')}
        placeholder={t('loginPasswordPlaceholder')}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        passwordToggleLabels={{
          show: t('showPassword'),
          hide: t('hidePassword'),
        }}
      />
    </>
  );
}
export default PasswordLoginForm;
