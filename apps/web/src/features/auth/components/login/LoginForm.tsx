'use client';

import React, { useState, useEffect } from 'react';
import { VIETNAM_PHONE_REGEX } from '@repo/shared/validation';
import { useTranslations } from 'next-intl';
import { motion } from 'motion/react';
import { ArrowRight, Send } from 'lucide-react';
import { showToast } from '@/components/ui/toast';
import { useLogin } from '../../hooks/useLogin';

// Shared Components
import { AuthHeader } from '../AuthHeader';
import { AuthFormShell, authItemVariants } from '../AuthFormShell';
import { AuthSubmitButton } from '../AuthSubmitButton';

// Sub-components
import { LoginTabs } from './LoginTabs';
import { PasswordLoginForm } from './PasswordLoginForm';
import { OtpLoginForm } from './OtpLoginForm';
import { LoginRememberForgot } from './LoginRememberForgot';
import { LoginSocial } from './LoginSocial';
import { LoginFooter } from './LoginFooter';

export function LoginForm() {
  const t = useTranslations('Auth');
  const {
    login,
    loginWithOtp,
    loginWithGoogle,
    isLoading,
    isSendingOtp,
    isOtpMode,
    setIsOtpMode,
    otpSent,
    otpInput,
    setOtpInput,
    otpError,
    resetOtp,
    sendOtpCode,
    resendSeconds,
  } = useLogin();

  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  // Lỗi nhập liệu hiển thị ngay dưới từng ô (luồng của TextField), submitCount để lỗi rung lại khi bấm lần nữa
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<'emailOrPhone' | 'password' | 'phone' | 'otp', string>>>({});
  const [submitCount, setSubmitCount] = useState(0);

  const isBusy = isLoading || isSendingOtp;

  const clearFieldError = (field: keyof typeof fieldErrors) => {
    if (fieldErrors[field]) setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  /** Kiểm tra SĐT trước khi gửi mã — sai thì báo dưới ô, không gọi API */
  const handleSendOtp = () => {
    const value = phone.trim();
    const phoneError = !value ? t('phoneRequired') : !VIETNAM_PHONE_REGEX.test(value) ? t('invalidPhone') : undefined;
    if (phoneError) {
      setFieldErrors({ phone: phoneError });
      setSubmitCount((count) => count + 1);
      return;
    }
    sendOtpCode(value);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const shouldNotifySessionExpired = window.sessionStorage.getItem('auth:session-expired') === 'true';
    if (!shouldNotifySessionExpired) return;

    window.sessionStorage.removeItem('auth:session-expired');
    showToast.error(t('sessionExpired'));
  }, [t]);

  const handlePhoneChange = (value: string) => {
    setPhone(value);
    clearFieldError('phone');
    if (otpSent) resetOtp();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;

    if (!isOtpMode) {
      const errors = {
        emailOrPhone: emailOrPhone.trim() ? undefined : t('emailOrPhoneRequired'),
        password: password ? undefined : t('passwordRequired'),
      };
      setFieldErrors(errors);
      setSubmitCount((count) => count + 1);
      if (errors.emailOrPhone || errors.password) return;
      login(emailOrPhone, password, rememberMe);
    } else if (!otpSent) {
      handleSendOtp();
    } else if (otpInput.length < 6) {
      setFieldErrors({ otp: t('otpRequired') });
      setSubmitCount((count) => count + 1);
    } else {
      loginWithOtp(phone);
    }
  };

  const submitLabel = !isOtpMode ? t('login') : otpSent ? t('verifyAndLogin') : t('sendOtp');
  const submitIcon = isOtpMode && !otpSent ? <Send /> : <ArrowRight />;

  return (
    <AuthFormShell loading={isLoading}>
      <AuthHeader title={t('welcomeBack')} subtitle={t('pleaseLogin')} />
      <LoginTabs isOtpMode={isOtpMode} setIsOtpMode={setIsOtpMode} disabled={isBusy} t={t} />

      {/* Form */}
      <motion.form variants={authItemVariants} onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="space-y-4">
          {!isOtpMode ? (
            <PasswordLoginForm
              emailOrPhone={emailOrPhone}
              setEmailOrPhone={(value) => {
                setEmailOrPhone(value);
                clearFieldError('emailOrPhone');
              }}
              password={password}
              setPassword={(value) => {
                setPassword(value);
                clearFieldError('password');
              }}
              errors={fieldErrors}
              shakeKey={submitCount}
              disabled={isLoading}
              t={t}
            />
          ) : (
            <OtpLoginForm
              phone={phone}
              setPhone={handlePhoneChange}
              otpSent={otpSent}
              otpValue={otpInput}
              setOtpValue={(value) => {
                setOtpInput(value);
                clearFieldError('otp');
              }}
              phoneError={fieldErrors.phone}
              otpError={fieldErrors.otp || otpError}
              shakeKey={submitCount}
              onSendOtp={handleSendOtp}
              isSendingOtp={isSendingOtp}
              resendSeconds={resendSeconds}
              disabled={isLoading}
              t={t}
            />
          )}
        </div>

        {!isOtpMode && (
          <LoginRememberForgot rememberMe={rememberMe} setRememberMe={setRememberMe} t={t} />
        )}

        {/* Action Button */}
        <AuthSubmitButton
          loading={isLoading || (isOtpMode && !otpSent && isSendingOtp)}
          icon={submitIcon}
        >
          {submitLabel}
        </AuthSubmitButton>

        <LoginSocial isLoading={isBusy} loginWithGoogle={loginWithGoogle} t={t} />
      </motion.form>

      <LoginFooter t={t} />
    </AuthFormShell>
  );
}
export default LoginForm;
