import React from 'react';
import { showToast } from '@/components/ui/toast';
import { GoogleAuthButton } from '../../GoogleAuthButton';

interface LoginSocialProps {
  isLoading: boolean;
  loginWithGoogle: (credential: string) => void;
  t: (key: string) => string;
}

export function LoginSocial({ isLoading, loginWithGoogle, t }: LoginSocialProps) {
  return (
    <>
      {/* Divider */}
      <div className="relative flex py-1.5 sm:py-2.5 items-center">
        <div className="flex-grow border-t border-[var(--border)]"></div>
        <span className="flex-shrink mx-4 text-[var(--text-light)] text-[10px] font-bold uppercase tracking-widest">
          {t('orContinueWith')}
        </span>
        <div className="flex-grow border-t border-[var(--border)]"></div>
      </div>

      {/* Google Login Button */}
      <div className="w-full flex justify-center">
        <GoogleAuthButton
          label={t('continueWithGoogle')}
          onCredential={loginWithGoogle}
          onError={() => showToast.error(t('googleLoginFailed') || 'Đăng nhập Google thất bại')}
          disabled={isLoading}
        />
      </div>
    </>
  );
}
export default LoginSocial;
