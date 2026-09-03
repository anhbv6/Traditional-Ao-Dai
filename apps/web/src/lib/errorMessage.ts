import { showToast } from '@/components/ui/toast';
import { extractErrorMessage, ERROR_KEYS } from './api-client';

export { showToast };

export type Translator = (key: string, values?: any) => string;

const RESPONSE_KEY_PATTERN = /^[A-Z0-9_]+$/;

/**
 * Tra cứu và dịch một chuỗi hoặc mã khóa lỗi/phản hồi sang ngôn ngữ tương ứng thông qua hàm `t` của next-intl
 */
export function translateMessage(
  keyOrMessage: string | undefined | null,
  fallback?: string,
  t?: Translator
): string {
  const defaultFallback = fallback || '';

  if (!keyOrMessage) {
    if (fallback && t && RESPONSE_KEY_PATTERN.test(fallback)) {
      return translateMessage(fallback, fallback, t);
    }
    return defaultFallback;
  }

  // Nếu không có translator, trả về chính nó hoặc fallback
  if (!t) {
    return keyOrMessage;
  }

  // Nếu không phải dạng UPPERCASE_KEY (ví dụ câu văn tự do do backend trả về), giữ nguyên
  if (!RESPONSE_KEY_PATTERN.test(keyOrMessage)) {
    return keyOrMessage;
  }

  // 1. Thử tra cứu responses.${key}
  try {
    const resKey = `responses.${keyOrMessage}`;
    const translated = t(resKey);
    if (translated && translated !== resKey) {
      return translated;
    }
  } catch {}

  // 2. Thử tra cứu errors.${key}
  try {
    const errKey = `errors.${keyOrMessage}`;
    const translated = t(errKey);
    if (translated && translated !== errKey) {
      return translated;
    }
  } catch {}

  // 3. Thử tra cứu trực tiếp ${key}
  try {
    const translated = t(keyOrMessage);
    if (translated && translated !== keyOrMessage) {
      return translated;
    }
  } catch {}

  // 4. Nếu message không tìm thấy bản dịch, thử dịch fallback nếu fallback là UPPERCASE_KEY
  if (fallback && RESPONSE_KEY_PATTERN.test(fallback)) {
    try {
      const resFallbackKey = `responses.${fallback}`;
      const transFallback = t(resFallbackKey);
      if (transFallback && transFallback !== resFallbackKey) {
        return transFallback;
      }
      const directFallback = t(fallback);
      if (directFallback && directFallback !== fallback) {
        return directFallback;
      }
    } catch {}
  }

  return defaultFallback || keyOrMessage;
}

/**
 * Trích xuất lỗi từ nhiều định dạng và tự động dịch sang thông điệp hoàn chỉnh
 */
export function resolveErrorMessage(
  err: unknown,
  fallback?: string,
  t?: Translator
): string {
  const rawMsg = extractErrorMessage(err, fallback || ERROR_KEYS.DEFAULT_ERROR);
  return translateMessage(rawMsg, fallback, t);
}

/**
 * Trích xuất lỗi, tự động dịch i18n và hiển thị toast thông báo lỗi (showToast.error)
 * @returns Thông điệp lỗi đã được dịch (để tiện gán vào state, form error nếu cần)
 */
export function notifyError(
  err: unknown,
  fallback?: string,
  t?: Translator
): string {
  const message = resolveErrorMessage(err, fallback, t);
  showToast.error(message);
  return message;
}

/**
 * Hiển thị toast thông báo thành công (showToast.success) có hỗ trợ dịch i18n
 * @returns Thông điệp thành công đã được dịch
 */
export function notifySuccess(
  keyOrMessage: string,
  fallback?: string,
  t?: Translator
): string {
  const message = translateMessage(keyOrMessage, fallback || keyOrMessage, t);
  showToast.success(message);
  return message;
}

/**
 * Custom Hook tiện ích để sử dụng trong các React Component / Hook có sẵn hàm `t`
 */
export function useErrorMessage(t?: Translator) {
  const showError = (err: unknown, fallback?: string) => notifyError(err, fallback, t);
  const getError = (err: unknown, fallback?: string) => resolveErrorMessage(err, fallback, t);
  const showSuccess = (keyOrMessage: string, fallback?: string) => notifySuccess(keyOrMessage, fallback, t);

  return {
    notifyError: showError,
    showError,
    getError,
    resolveErrorMessage: getError,
    notifySuccess: showSuccess,
    showSuccess,
  };
}
