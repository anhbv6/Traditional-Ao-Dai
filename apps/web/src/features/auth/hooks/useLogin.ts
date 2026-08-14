import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/routing';
import { getMeApi, loginApi } from '../api/auth.api';
import { useAuthStore } from '../store/authStore';
import { showToast } from '@/components/ui/toast';
import { HttpError } from '@/lib/api-client';

export function useLogin() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const login = async (emailOrPhone: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await loginApi({ email: emailOrPhone.trim(), password });

      const { setAccessToken, setAuthenticated, setLoading } = useAuthStore.getState();
      setAccessToken(res.data.accessToken);

      const me = await getMeApi();
      setAuthenticated(res.data.accessToken, me.data);
      setLoading(false);

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
