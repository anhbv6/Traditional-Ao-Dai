import { useState } from 'react';
import { VIETNAM_PHONE_REGEX } from '@repo/shared/validation';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { loginApi, sendOtpApi, loginWithOtpApi, loginWithGoogleApi } from '../api/auth.api';
import { establishCustomerSession } from '../utils/session';
import { notifyError, notifySuccess } from '@/lib/messages';
import { useCountdown } from './useCountdown';

export function useLogin() {
  const t = useTranslations('Auth');
  const router = useRouter();
  // Đang gửi yêu cầu đăng nhập (mật khẩu / OTP / Google) — giữ nguyên tới khi chuyển trang xong
  const [isLoading, setIsLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // OTP Login States
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInputState] = useState('');
  const [otpError, setOtpError] = useState('');
  const resendCountdown = useCountdown();

  const setOtpInput = (value: string) => {
    setOtpInputState(value);
    if (otpError) setOtpError('');
  };

  /** Đổi số điện thoại sau khi đã gửi mã → mã cũ không còn đúng, buộc gửi lại */
  const resetOtp = () => {
    setOtpSent(false);
    setOtpInputState('');
    setOtpError('');
    resendCountdown.reset();
  };

  const finishLogin = async (accessToken: string, message: string) => {
    await establishCustomerSession(accessToken);
    notifySuccess(message, t('LOGIN_SUCCESS'), t);
    router.push('/');
    router.refresh();
  };

  const login = async (emailOrPhone: string, password: string, rememberMe: boolean) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await loginApi({ identifier: emailOrPhone.trim(), password, rememberMe });
      await finishLogin(res.data.accessToken, res.message);
    } catch (err: unknown) {
      console.error('Login failed:', err);
      notifyError(err, 'LOGIN_FAILED', t);
      setIsLoading(false);
    }
  };

  const sendOtpCode = async (phone: string) => {
    if (isSendingOtp || resendCountdown.isRunning) return;
    // Định dạng SĐT đã được LoginForm kiểm tra và báo dưới ô — ở đây chỉ chặn phòng hờ
    if (!VIETNAM_PHONE_REGEX.test(phone.trim())) return;

    setIsSendingOtp(true);
    try {
      await sendOtpApi(phone.trim(), 'LOGIN');
      setOtpSent(true);
      setOtpInputState('');
      setOtpError('');
      resendCountdown.start();
      notifySuccess(t('otpSent'));
    } catch (err: unknown) {
      console.error(err);
      notifyError(err, 'OTP_SEND_FAILED', t);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const loginWithOtp = async (phone: string, rememberMe: boolean = true) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await loginWithOtpApi({ phone: phone.trim(), code: otpInput, rememberMe });
      await finishLogin(res.data.accessToken, res.message);
    } catch (err: unknown) {
      console.error(err);
      const apiMsg = notifyError(err, 'LOGIN_FAILED', t);
      setOtpError(apiMsg);
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string, rememberMe: boolean = true) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const res = await loginWithGoogleApi(credential, rememberMe);
      await finishLogin(res.data.accessToken, res.message);
    } catch (err: unknown) {
      console.error('Google login failed:', err);
      notifyError(err, 'GOOGLE_AUTH_FAILED', t);
      setIsLoading(false);
    }
  };

  return {
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
    resendSeconds: resendCountdown.seconds,
  };
}
