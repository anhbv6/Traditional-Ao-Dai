import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { getMeApi, loginApi, sendOtpApi, loginWithOtpApi, loginWithGoogleApi } from '../api/auth.api';
import { type AuthUser } from '../types/auth.types';
import { useAuthStore } from '../store/authStore';
import { showToast } from '@/components/ui/toast';
import { HttpError } from '@/lib/api-client';

export function useLogin() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // OTP Login States
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpSentCode, setOtpSentCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  const login = async (emailOrPhone: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await loginApi({ email: emailOrPhone.trim(), password });

      const { setAccessToken, setAuthenticated, setLoading } = useAuthStore.getState();
      setAccessToken(res.data.accessToken);

      const me = await getMeApi();
      setAuthenticated(res.data.accessToken, me.data);
      setLoading(false);

      const successMsg = t(res.message) || t('success');
      showToast.success(successMsg);

      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      console.error('Login failed:', err);
      const payload = err instanceof HttpError ? err.payload : undefined;
      const apiMsg =
        payload && typeof payload === 'object' && 'message' in payload
          ? String(payload.message)
          : err instanceof Error
            ? err.message
            : 'Login failed';
      showToast.error(apiMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const sendOtpCode = async (phone: string) => {
    const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;
    if (!phoneRegex.test(phone.trim())) {
      showToast.error(t('invalidPhone') || 'Số điện thoại không hợp lệ');
      return;
    }

    setIsLoading(true);
    try {
      await sendOtpApi(phone, 'LOGIN');
      setOtpSent(true);
      setOtpError('');
      showToast.success(t('otpSent') || 'Đã gửi OTP qua SMS!');
    } catch (err: unknown) {
      console.error(err);
      const payload = err instanceof HttpError ? err.payload : undefined;
      const apiMsg =
        payload && typeof payload === 'object' && 'message' in payload
          ? String(payload.message)
          : err instanceof Error
            ? err.message
            : 'Gửi OTP thất bại';
      showToast.error(apiMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOtp = async (phone: string) => {
    setIsLoading(true);
    try {
      const res = await loginWithOtpApi({ phone, code: otpInput });

      const { setAccessToken, setAuthenticated, setLoading } = useAuthStore.getState();
      setAccessToken(res.data.accessToken);

      const me = await getMeApi();
      setAuthenticated(res.data.accessToken, me.data);
      setLoading(false);

      showToast.success(t('success') || 'Đăng nhập thành công!');
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      const payload = err instanceof HttpError ? err.payload : undefined;
      const apiMsg =
        payload && typeof payload === 'object' && 'message' in payload
          ? String(payload.message)
          : err instanceof Error
            ? err.message
            : 'Đăng nhập thất bại';
      setOtpError(apiMsg);
      showToast.error(apiMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string) => {
    setIsLoading(true);
    try {
      const res = await loginWithGoogleApi(credential);

      const { setAccessToken, setAuthenticated, setLoading } = useAuthStore.getState();
      setAccessToken(res.data.accessToken);

      const me = await getMeApi();
      setAuthenticated(res.data.accessToken, me.data);
      setLoading(false);

      showToast.success(t('success') || 'Đăng nhập thành công!');
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      console.error('Google login failed:', err);
      const payload = err instanceof HttpError ? err.payload : undefined;
      const apiMsg =
        payload && typeof payload === 'object' && 'message' in payload
          ? String(payload.message)
          : err instanceof Error
            ? err.message
            : 'Đăng nhập Google thất bại';
      showToast.error(apiMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    login,
    loginWithOtp,
    loginWithGoogle,
    isLoading,
    isOtpMode,
    setIsOtpMode,
    otpSent,
    setOtpSent,
    otpInput,
    setOtpInput,
    otpError,
    setOtpError,
    sendOtpCode,
  };
}
