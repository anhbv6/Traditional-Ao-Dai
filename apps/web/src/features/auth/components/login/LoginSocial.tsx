import React from 'react';
import { showToast } from '@/components/ui/toast';
import { GoogleAuthButton } from '../GoogleAuthButton';
import { AuthDivider } from '../AuthDivider';

interface LoginSocialProps {
  isLoading: boolean;
  loginWithGoogle: (credential: string) => void;
  t: (key: string) => string;
}

/** Khối "Hoặc tiếp tục bằng" + nút Google — dùng chung cho Đăng nhập và Đăng ký */
export function LoginSocial({ isLoading, loginWithGoogle, t }: LoginSocialProps) {
  return (
    <>
      <AuthDivider label={t('orContinueWith')} />
      <GoogleAuthButton
        label={t('continueWithGoogle')}
        onCredential={loginWithGoogle}
        onError={() => showToast.error(t('googleLoginFailed'))}
        disabled={isLoading}
      />
    </>
  );
}
export default LoginSocial;
