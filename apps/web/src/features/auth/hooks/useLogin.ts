import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { getMeApi, loginApi, sendOtpApi, loginWithOtpApi, loginWithGoogleApi } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';
import { showToast } from '@/components/ui/toast';
import { notifyError, notifySuccess } from '@/lib/messages';

export function useLogin() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // OTP Login States
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  const login = async (emailOrPhone: string, password: string, rememberMe: boolean) => {
    setIsLoading(true);
    try {
      const res = await loginApi({ email: emailOrPhone.trim(), password, rememberMe });

      const { setAccessToken, setAuthenticated, setLoading } = useAuthStore.getState();
      setAccessToken(res.data.accessToken);

      const me = await getMeApi();
      setAuthenticated(res.data.accessToken, me.data);
      setLoading(false);

      // Lưu cookie cho Next.js Server Middleware (Proxy) nhận diện
      // Nếu rememberMe=true: lưu 7 ngày; nếu false: session cookie (tự xóa khi tắt trình duyệt, khớp với BE)
      const maxAgeAttr = rememberMe ? `; max-age=${7 * 86400}` : '';
      document.cookie = `user_logged_in=true; path=/${maxAgeAttr}; SameSite=Lax`;
      document.cookie = `auth_role=${me.data?.role || 'CUSTOMER'}; path=/${maxAgeAttr}; SameSite=Lax`;

      notifySuccess(res.message, t('LOGIN_SUCCESS') || t('success'), t);

      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      console.error('Login failed:', err);
      notifyError(err, 'LOGIN_FAILED', t);
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
      notifySuccess(t('otpSent') || 'Đã gửi OTP qua SMS!');
    } catch (err: unknown) {
      console.error(err);
      notifyError(err, 'OTP_SEND_FAILED', t);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithOtp = async (phone: string, rememberMe: boolean = true) => {
    setIsLoading(true);
    try {
      const res = await loginWithOtpApi({ phone, code: otpInput, rememberMe });

      const { setAccessToken, setAuthenticated, setLoading } = useAuthStore.getState();
      setAccessToken(res.data.accessToken);

      const me = await getMeApi();
      setAuthenticated(res.data.accessToken, me.data);
      setLoading(false);

      const maxAgeAttr = rememberMe ? `; max-age=${7 * 86400}` : '';
      document.cookie = `user_logged_in=true; path=/${maxAgeAttr}; SameSite=Lax`;
      document.cookie = `auth_role=${me.data?.role || 'CUSTOMER'}; path=/${maxAgeAttr}; SameSite=Lax`;

      notifySuccess(res.message, t('LOGIN_SUCCESS') || t('success'), t);
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      console.error(err);
      const apiMsg = notifyError(err, 'LOGIN_FAILED', t);
      setOtpError(apiMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithGoogle = async (credential: string, rememberMe: boolean = true) => {
    setIsLoading(true);
    try {
      const res = await loginWithGoogleApi(credential, rememberMe);

      const { setAccessToken, setAuthenticated, setLoading } = useAuthStore.getState();
      setAccessToken(res.data.accessToken);

      const me = await getMeApi();
      setAuthenticated(res.data.accessToken, me.data);
      setLoading(false);

      const maxAgeAttr = rememberMe ? `; max-age=${7 * 86400}` : '';
      document.cookie = `user_logged_in=true; path=/${maxAgeAttr}; SameSite=Lax`;
      document.cookie = `auth_role=${me.data?.role || 'CUSTOMER'}; path=/${maxAgeAttr}; SameSite=Lax`;

      notifySuccess(res.message, t('LOGIN_SUCCESS') || t('success'), t);
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      console.error('Google login failed:', err);
      notifyError(err, 'GOOGLE_AUTH_FAILED', t);
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
