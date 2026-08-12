"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { createRegisterSchema, type RegisterFormData } from '../types/register.types';
import { mockCheckEmailApi } from '../api/register.api';

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

  // Debounced Email Availability API Check (650ms)
  useEffect(() => {
    let isActive = true;
    const resetStatus = () => {
      if (!isActive) return;
      setIsCheckingEmail(false);
      setEmailCheckResult(null);
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
      clearErrors('email');
    }, 0);

    const delay = setTimeout(async () => {
      try {
        const res = await mockCheckEmailApi(emailVal);
        if (!isActive) return;

        if (res.isTaken) {
          setEmailCheckResult('taken');
          setError('email', { message: t('emailTaken') });
        } else {
          setEmailCheckResult('available');
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

  const onFormSubmit = (data: RegisterFormData) => {
    if (data.registerType === 'email') {
      if (emailCheckResult === 'taken') {
        setError('email', { message: t('emailTaken') });
        return;
      }
      alert(t('registerSuccessEmail', { name: data.fullName }));
      router.push('/login');
    } else {
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setOtpSentCode(randomOtp);
      setOtpError('');
      setIsOtpStep(true);
      
      setTimeout(() => {
        alert(t('smsOtpMessage', { otp: randomOtp }));
      }, 500);
    }
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput === otpSentCode) {
      alert(t('registerSuccessPhone'));
      setIsOtpStep(false);
      router.push('/login');
    } else {
      setOtpError(t('otpInvalid'));
    }
  };

  const handleResendOtp = () => {
    const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpSentCode(randomOtp);
    setOtpInput('');
    setOtpError('');
    alert(t('smsOtpResent', { otp: randomOtp }));
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
