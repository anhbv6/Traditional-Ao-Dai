"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { type RegisterFormData } from '../types/register.types';
import { createRegisterSchema } from '../validations/register.validation';
import { extractErrorMessage } from '@/lib/messages';
import { notifyError, notifySuccess } from '@/lib/messages';
import { withMinDelay } from '@/lib/utils';
import { checkEmailApi, checkPhoneApi, registerApi, sendRegisterEmailCodeApi } from '../api/register.api';
import { loginWithGoogleApi, sendOtpApi } from '../api/auth.api';
import { establishCustomerSession } from '../utils/session';
import { useCountdown } from './useCountdown';

export function useRegister() {
  const t = useTranslations('Auth');
  const router = useRouter();

  // Create the Zod Schema dynamically with current translations
  const registerSchema = createRegisterSchema(t);

  const [showPassword, setShowPassword] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');
  
  // Debounce API Check States
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailCheckResult, setEmailCheckResult] = useState<'available' | 'taken' | null>(null);
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [phoneCheckResult, setPhoneCheckResult] = useState<'available' | 'taken' | null>(null);

  const [emailApiError, setEmailApiError] = useState('');
  const [phoneApiError, setPhoneApiError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  // Nơi đã được gửi mã gần nhất, dạng "email:<giá trị>" | "phone:<giá trị>" (để vào lại bước nhập mã đúng nơi nhận)
  const [codeTarget, setCodeTarget] = useState('');
  // Thời gian chờ gửi lại OTP — chạy tiếp khi quay lại sửa form rồi vào lại bước OTP
  const resendCountdown = useCountdown();

  const {
    register,
    handleSubmit,
    watch,
    getValues,
    control,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isValid, submitCount },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    defaultValues: {
      fullName: '',
      registerType: 'email',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  });

  const registerType = useWatch({ control, name: 'registerType' });
  const emailVal = useWatch({ control, name: 'email' });
  const phoneVal = useWatch({ control, name: 'phone' });

  // Debounced Email Availability API Check (650ms)
  useEffect(() => {
    let isActive = true;
    const resetStatus = () => {
      if (!isActive) return;
      setIsCheckingEmail(false);
      setEmailCheckResult(null);
      setEmailApiError('');
    };

    if (registerType !== 'email' || !emailVal) {
      const resetDelay = setTimeout(resetStatus, 0);
      return () => {
        isActive = false;
        clearTimeout(resetDelay);
      };
    }

    const emailValid = z.string().email().safeParse(emailVal).success;
    if (!emailValid) {
      const resetDelay = setTimeout(resetStatus, 0);
      return () => {
        isActive = false;
        clearTimeout(resetDelay);
      };
    }

    const checkingDelay = setTimeout(() => {
      if (!isActive) return;
      setIsCheckingEmail(true);
      setEmailCheckResult(null);
      setEmailApiError('');
      clearErrors('email');
    }, 0);

    const delay = setTimeout(async () => {
      try {
        const res = await checkEmailApi(emailVal);
        if (!isActive) return;

        if (res.isTaken) {
          const errMsg = res.reason === 'EMAIL_TAKEN' ? t('emailTaken') : t('emailTaken');
          setEmailCheckResult('taken');
          setEmailApiError(errMsg);
          setError('email', { message: errMsg });
        } else {
          setEmailCheckResult('available');
          setEmailApiError('');
          clearErrors('email');
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isActive) {
          setIsCheckingEmail(false);
        }
      }
    }, 650);

    return () => {
      isActive = false;
      clearTimeout(checkingDelay);
      clearTimeout(delay);
    };
  }, [emailVal, registerType, setError, clearErrors, t]);

  // Debounced Phone Availability API Check (650ms)
  useEffect(() => {
    let isActive = true;
    const resetStatus = () => {
      if (!isActive) return;
      setIsCheckingPhone(false);
      setPhoneCheckResult(null);
      setPhoneApiError('');
    };

    if (registerType !== 'phone' || !phoneVal) {
      const resetDelay = setTimeout(resetStatus, 0);
      return () => {
        isActive = false;
        clearTimeout(resetDelay);
      };
    }

    const phoneValid = z.string().regex(/^[0-9]{10,11}$/).safeParse(phoneVal).success;
    if (!phoneValid) {
      const resetDelay = setTimeout(resetStatus, 0);
      return () => {
        isActive = false;
        clearTimeout(resetDelay);
      };
    }

    const checkingDelay = setTimeout(() => {
      if (!isActive) return;
      setIsCheckingPhone(true);
      setPhoneCheckResult(null);
      setPhoneApiError('');
      clearErrors('phone');
    }, 0);

    const delay = setTimeout(async () => {
      try {
        const res = await checkPhoneApi(phoneVal);
        if (!isActive) return;

        if (res.isTaken) {
          const errMsg = res.reason === 'PHONE_TAKEN' ? t('phoneTaken') : t('phoneTaken');
          setPhoneCheckResult('taken');
          setPhoneApiError(errMsg);
          setError('phone', { message: errMsg });
        } else {
          setPhoneCheckResult('available');
          setPhoneApiError('');
          clearErrors('phone');
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (isActive) {
          setIsCheckingPhone(false);
        }
      }
    }, 650);

    return () => {
      isActive = false;
      clearTimeout(checkingDelay);
      clearTimeout(delay);
    };
  }, [phoneVal, registerType, setError, clearErrors, t]);


  /** Khóa nơi nhận mã của form hiện tại — đổi email/SĐT thì phải gửi mã mới */
  const targetKeyOf = (data: { registerType: 'email' | 'phone'; email?: string; phone?: string }) =>
    data.registerType === 'email' ? `email:${data.email ?? ''}` : `phone:${data.phone ?? ''}`;

  /** Gửi mã xác minh tới email hoặc OTP tới SĐT tùy cách đăng ký */
  const sendCode = (data: RegisterFormData) =>
    data.registerType === 'email' ? sendRegisterEmailCodeApi(data.email) : sendOtpApi(data.phone, 'REGISTER');

  const onFormSubmit = async (data: RegisterFormData) => {
    if (data.registerType === 'email' && emailCheckResult === 'taken') {
      setError('email', { message: emailApiError || t('emailTaken') });
      return;
    }
    if (data.registerType === 'phone' && phoneCheckResult === 'taken') {
      setError('phone', { message: phoneApiError || t('phoneTaken') });
      return;
    }

    const targetKey = targetKeyOf(data);
    // Mã cho đúng nơi nhận này vẫn còn trong thời gian chờ → vào thẳng bước nhập mã, không gửi lại
    if (codeTarget === targetKey && resendCountdown.isRunning) {
      setIsOtpStep(true);
      return;
    }

    try {
      setIsRegistering(true);
      await withMinDelay(sendCode(data), 2000);
      setOtpInput('');
      setOtpError('');
      setCodeTarget(targetKey);
      resendCountdown.start();
      setIsOtpStep(true);
      notifySuccess(t(data.registerType === 'email' ? 'emailCodeSent' : 'otpSent'));
    } catch (err: unknown) {
      console.error('Failed to send verification code:', err);
      const rawMsg = extractErrorMessage(err, 'OTP_SEND_FAILED');
      const apiMsg = notifyError(err, 'OTP_SEND_FAILED', t);
      if (rawMsg === 'EMAIL_ALREADY_EXISTS') {
        setError('email', { message: apiMsg });
      } else if (rawMsg === 'PHONE_ALREADY_EXISTS') {
        setError('phone', { message: apiMsg });
      } else if (rawMsg === 'OTP_COOLDOWN_ACTIVE' || rawMsg === 'COOLDOWN_ACTIVE') {
        setCodeTarget(targetKey);
      }
    } finally {
      setIsRegistering(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    // Đọc giá trị form trong event handler bằng getValues (watch() chỉ dùng khi cần re-render theo giá trị)
    const data = getValues();
    if (isRegistering) return;
    if (otpInput.length < 6) {
      setOtpError(t('otpRequired'));
      return;
    }

    try {
      setIsRegistering(true);
      const common = { name: data.fullName, password: data.password, code: otpInput };
      const res = await withMinDelay(
        registerApi(
          data.registerType === 'email'
            ? { ...common, registerType: 'email', email: data.email }
            : { ...common, registerType: 'phone', phone: data.phone }
        ),
        2000
      );
      notifySuccess(
        res.message,
        data.registerType === 'email' ? t('registerSuccessEmail', { name: data.fullName }) : t('registerSuccessPhone'),
        t
      );
      // Giữ loading tới khi sang trang đăng nhập
      router.push('/login');
    } catch (err: unknown) {
      console.error('Registration failed:', err);
      const apiMsg = notifyError(err, 'OTP_VERIFICATION_FAILED', t);
      setOtpError(apiMsg);
      setIsRegistering(false);
    }
  };

  const handleOtpChange = (value: string) => {
    setOtpInput(value);
    if (otpError) setOtpError('');
  };

  const handleResendOtp = async () => {
    const data = getValues();
    if (isResendingOtp || resendCountdown.isRunning) return;

    setIsResendingOtp(true);
    try {
      await sendCode(data);
      setOtpInput('');
      setOtpError('');
      setCodeTarget(targetKeyOf(data));
      resendCountdown.start();
      notifySuccess(t(data.registerType === 'email' ? 'emailCodeSent' : 'otpSent'));
    } catch (err: unknown) {
      console.error('Failed to resend OTP:', err);
      notifyError(err, 'OTP_RESEND_FAILED', t);
    } finally {
      setIsResendingOtp(false);
    }
  };

  const handleGoogleSignUp = async (credential: string) => {
    if (isRegistering) return;
    try {
      setIsRegistering(true);
      const res = await loginWithGoogleApi(credential);

      await establishCustomerSession(res.data.accessToken);

      notifySuccess(res.message, t('LOGIN_SUCCESS'), t);
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      console.error('Google signup failed:', err);
      notifyError(err, 'GOOGLE_AUTH_FAILED', t);
      setIsRegistering(false);
    }
  };

  return {
    t,
    router,
    showPassword,
    setShowPassword,
    isOtpStep,
    setIsOtpStep,
    otpInput,
    setOtpInput: handleOtpChange,
    otpError,
    setOtpError,
    isCheckingEmail,
    emailCheckResult,
    emailApiError,
    isCheckingPhone,
    phoneCheckResult,
    phoneApiError,
    isRegistering,
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    errors,
    isValid,
    submitCount,
    registerType,
    onFormSubmit,
    handleVerifyOtp,
    handleResendOtp,
    handleGoogleSignUp,
    isResendingOtp,
    resendSeconds: resendCountdown.seconds,
    // Đã gửi mã cho đúng email/SĐT đang nhập → cho phép vào lại bước nhập mã
    otpSentOnce: !!codeTarget && codeTarget === targetKeyOf({ registerType, email: emailVal, phone: phoneVal }),
    /** Nơi nhận mã hiển thị ở bước nhập mã */
    codeDestination: (registerType === 'email' ? emailVal : phoneVal) || '',
  };
}
