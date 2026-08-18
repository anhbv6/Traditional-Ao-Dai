"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createRegisterSchema, type RegisterFormData } from '../types/register.types';
import { mockCheckEmailApi, checkPhoneApi, registerApi, sendOtpApi } from '../api/register.api';
import { showToast } from '@/components/ui/toast';
import { HttpError } from '@/lib/api-client';

function getErrorMessage(err: unknown, fallback: string) {
  const payload = err instanceof HttpError ? err.payload : undefined;

  if (payload && typeof payload === 'object' && 'message' in payload) {
    return String(payload.message);
  }

  if (err instanceof Error) {
    return err.message;
  }

  return fallback;
}

export function useRegister() {
  const t = useTranslations('Auth');
  const router = useRouter();

  // Create the Zod Schema dynamically with current translations
  const registerSchema = createRegisterSchema(t);

  const [showPassword, setShowPassword] = useState(false);
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpSentCode, setOtpSentCode] = useState('');
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

  const {
    register,
    handleSubmit,
    watch,
    control,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isValid },
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
        const res = await mockCheckEmailApi(emailVal);
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


  const onFormSubmit = async (data: RegisterFormData) => {
    if (data.registerType === 'email') {
      if (emailCheckResult === 'taken') {
        setError('email', { message: emailApiError || t('emailTaken') });
        return;
      }
      try {
        setIsRegistering(true);
        const res = await registerApi({
          registerType: 'email',
          name: data.fullName,
          password: data.password,
          email: data.email,
        });
        const successMsg = t(res.message) || t('registerSuccessEmail', { name: data.fullName });
        showToast.success(successMsg);
        router.push('/login');
      } catch (err: unknown) {
        console.error('Registration failed:', err);
        const apiMsg = getErrorMessage(err, 'Registration failed');
        if (apiMsg.toLowerCase().includes('email')) {
          setError('email', { message: apiMsg });
        } else if (apiMsg.toLowerCase().includes('số điện thoại') || apiMsg.toLowerCase().includes('phone')) {
          setError('phone', { message: apiMsg });
        } else {
          showToast.error(apiMsg);
        }
      } finally {
        setIsRegistering(false);
      }
    } else {
      if (phoneCheckResult === 'taken') {
        setError('phone', { message: phoneApiError || t('phoneTaken') });
        return;
      }
      try {
        setIsRegistering(true);
        await sendOtpApi(data.phone, 'REGISTER');
        setOtpError('');
        setIsOtpStep(true);
        showToast.success('Mã OTP đã được gửi đến số điện thoại của bạn.');
      } catch (err: unknown) {
        console.error('Failed to send OTP:', err);
        const apiMsg = getErrorMessage(err, 'Gửi mã OTP thất bại');
        setError('phone', { message: apiMsg });
      } finally {
        setIsRegistering(false);
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = watch();
    if (data.registerType !== 'phone') return;

    setIsRegistering(true);
    try {
      const res = await registerApi({
        registerType: 'phone',
        name: data.fullName,
        password: data.password,
        phone: data.phone,
        code: otpInput,
      });
      const successMsg = t(res.message) || t('registerSuccessPhone');
      showToast.success(successMsg);
      setIsOtpStep(false);
      router.push('/login');
    } catch (err: unknown) {
      console.error('Registration failed:', err);
      const apiMsg = getErrorMessage(err, 'Xác thực OTP thất bại');
      setOtpError(apiMsg);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleResendOtp = async () => {
    const data = watch();
    if (data.registerType !== 'phone') return;

    try {
      await sendOtpApi(data.phone, 'REGISTER');
      setOtpInput('');
      setOtpError('');
      showToast.success('Mã OTP đã được gửi lại.');
    } catch (err: unknown) {
      console.error('Failed to resend OTP:', err);
      const apiMsg = getErrorMessage(err, 'Gửi lại mã OTP thất bại');
      setOtpError(apiMsg);
    }
  };

  const handleGoogleSignUp = () => {};

  return {
    t,
    router,
    showPassword,
    setShowPassword,
    isOtpStep,
    setIsOtpStep,
    otpInput,
    setOtpInput,
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
    registerType,
    onFormSubmit,
    handleVerifyOtp,
    handleResendOtp,
    handleGoogleSignUp,
  };
}
