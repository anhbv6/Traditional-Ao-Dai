import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { loginApi } from '../api/auth.api';
import { showToast } from '@/components/ui/toast';
import { HttpError, setBrowserAuthTokens } from '@/lib/api-client';

export function useLogin() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const login = async (emailOrPhone: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await loginApi({ email: emailOrPhone, password });

      setBrowserAuthTokens({
        accessToken: res.data.accessToken,
        refreshToken: res.data.refreshToken,
        refreshTokenExpiresAt: res.data.refreshTokenExpiresAt,
      });

      // Store basic user info
      localStorage.setItem('userInfo', JSON.stringify(res.data.user));

      // Display success message from translation or API response message
      const successMsg = t(res.message) || t('success');
      showToast.success(successMsg);

      // Redirect to home page and trigger router refresh to apply authentication changes
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

  return {
    login,
    isLoading,
  };
}
