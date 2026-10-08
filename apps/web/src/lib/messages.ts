import { showToast } from '@/components/ui/toast';

/**
 * Xử lý thông điệp (message) dùng chung cho toàn Frontend:
 * - Trích xuất mã lỗi từ mọi dạng lỗi (HttpError của apiClient, kết quả Server Action, Error JS...)
 * - Dịch mã KEY (UPPER_SNAKE_CASE) do Backend / Server Action trả về sang ngôn ngữ hiện tại bằng next-intl
 * - Hiển thị toast thành công / lỗi
 *
 * Quy ước: Backend và Server Action luôn trả mã KEY; bản dịch nằm trong `messages/<locale>/errors.json`
 * (được gộp vào mọi namespace: Auth.responses, ProfilePage.responses, AdminPage.login, Common.errors, Errors).
 */

export { showToast };

// ─── Trích xuất mã lỗi ─────────────────────────────────────────────────────────

/**
 * Bộ mã khóa lỗi chuẩn hóa cho toàn bộ hệ thống (i18n Error Keys)
 */
export const ERROR_KEYS = {
  DEFAULT_ERROR: 'DEFAULT_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  HTTP_400: 'HTTP_400',
  HTTP_401: 'HTTP_401',
  HTTP_403: 'HTTP_403',
  HTTP_404: 'HTTP_404',
  HTTP_409: 'HTTP_409',
  HTTP_422: 'HTTP_422',
  HTTP_429: 'HTTP_429',
  HTTP_500: 'HTTP_500',
  HTTP_502: 'HTTP_502',
  HTTP_503: 'HTTP_503',
  HTTP_504: 'HTTP_504',
} as const;

export type ErrorKey = (typeof ERROR_KEYS)[keyof typeof ERROR_KEYS];

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** Lấy chuỗi đã trim nếu `value` là chuỗi không rỗng */
const nonEmptyString = (value: unknown): string | undefined =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;

/** Lấy thông điệp từ một phần tử lỗi: chuỗi hoặc object có message/msg/error */
const messageOf = (item: unknown): string | undefined => {
  if (typeof item === 'string') return nonEmptyString(item);
  if (isRecord(item)) return nonEmptyString(item.message) ?? nonEmptyString(item.msg) ?? nonEmptyString(item.error);
  return undefined;
};

const joinMessages = (items: unknown[]): string | undefined => {
  const messages = items.map(messageOf).filter((m): m is string => Boolean(m));
  return messages.length > 0 ? messages.join(', ') : undefined;
};

const HTTP_STATUS_KEYS: Record<number, ErrorKey> = {
  400: ERROR_KEYS.HTTP_400,
  401: ERROR_KEYS.HTTP_401,
  403: ERROR_KEYS.HTTP_403,
  404: ERROR_KEYS.HTTP_404,
  409: ERROR_KEYS.HTTP_409,
  422: ERROR_KEYS.HTTP_422,
  429: ERROR_KEYS.HTTP_429,
  500: ERROR_KEYS.HTTP_500,
  502: ERROR_KEYS.HTTP_502,
  503: ERROR_KEYS.HTTP_503,
  504: ERROR_KEYS.HTTP_504,
};

/**
 * Đọc thông điệp lỗi từ payload JSON (ưu tiên đúng định dạng ApiError của Backend: `errors[]` rồi `message`)
 */
function messageFromPayload(payload: UnknownRecord): string | undefined {
  // 1. errors là mảng (Zod issues / validator) hoặc dictionary { field: message | message[] }
  if (Array.isArray(payload.errors)) {
    const joined = joinMessages(payload.errors);
    if (joined) return joined;
  } else if (isRecord(payload.errors)) {
    const joined = joinMessages(Object.values(payload.errors).flatMap((v) => (Array.isArray(v) ? v : [v])));
    if (joined) return joined;
  }

  // 2. message (chuỗi hoặc mảng chuỗi)
  const message = nonEmptyString(payload.message) ?? (Array.isArray(payload.message) ? joinMessages(payload.message) : undefined);
  if (message) return message;

  // 3. Các định dạng phổ biến khác: OAuth2, error, RFC 7807, data bọc lồng
  const nestedError = isRecord(payload.error) ? nonEmptyString(payload.error.message) : nonEmptyString(payload.error);
  const details = Array.isArray(payload.details) ? joinMessages(payload.details) : nonEmptyString(payload.details);
  const nestedData = isRecord(payload.data) ? nonEmptyString(payload.data.message) ?? nonEmptyString(payload.data.error) : undefined;

  return nonEmptyString(payload.error_description) ?? nestedError ?? nonEmptyString(payload.detail) ?? details ?? nestedData;
}

/**
 * Trích xuất mã khóa lỗi i18n hoặc thông báo lỗi từ nhiều định dạng lỗi khác nhau:
 * - HttpError từ API Backend (payload: message, errors mảng hoặc object, error_description, error, detail)
 * - Lỗi kết nối mạng (AbortError -> REQUEST_TIMEOUT, Failed to fetch -> NETWORK_ERROR)
 * - Mã HTTP Status Code khi không có payload chi tiết -> HTTP_400..HTTP_504
 * - Error thông thường trong JavaScript
 * - String hoặc Plain Object lỗi
 */
export function extractErrorMessage(
  err: unknown,
  fallback: string = ERROR_KEYS.DEFAULT_ERROR
): string {
  if (!err) {
    return fallback;
  }

  if (typeof err === 'string') {
    return nonEmptyString(err) ?? fallback;
  }

  // HttpError hoặc object có payload / status
  if (isRecord(err) && ('payload' in err || 'status' in err)) {
    let payload: unknown = err.payload;
    const status = typeof err.status === 'number' ? err.status : undefined;

    if (typeof payload === 'string') {
      const text = payload.trim();
      if (text.startsWith('{') || text.startsWith('[')) {
        try {
          payload = JSON.parse(text);
        } catch {
          // Không phải JSON hợp lệ
        }
      } else if (text && !/^<(!doctype|html)/i.test(text)) {
        // Không phải trang HTML lỗi của server thì trả về nguyên văn
        return text;
      }
    }

    if (isRecord(payload)) {
      const message = messageFromPayload(payload);
      if (message) return message;
    }

    // Không có thông điệp nhưng có HTTP status -> trả mã i18n chuẩn (trừ khi caller truyền fallback riêng)
    const isCustomFallback = fallback !== ERROR_KEYS.DEFAULT_ERROR;
    if (status && !isCustomFallback) {
      return HTTP_STATUS_KEYS[status] ?? `HTTP_${status}`;
    }
  }

  // Axios-like error (err.response.data)
  if (isRecord(err) && isRecord(err.response) && err.response.data) {
    const axiosMessage = extractErrorMessage(err.response.data, fallback);
    if (axiosMessage !== fallback) return axiosMessage;
  }

  if (err instanceof Error) {
    if (err.name === 'AbortError') {
      return ERROR_KEYS.REQUEST_TIMEOUT;
    }
    const lowerMessage = err.message.toLowerCase();
    if (
      lowerMessage === 'failed to fetch' ||
      lowerMessage.includes('networkerror') ||
      lowerMessage.includes('network request failed') ||
      lowerMessage.includes('err_connection_refused')
    ) {
      return ERROR_KEYS.NETWORK_ERROR;
    }
    // Bỏ qua các chuỗi kỹ thuật vô nghĩa với người dùng
    if (!err.message.startsWith('HTTP Error:') && err.message !== '[object Object]') {
      const message = nonEmptyString(err.message);
      if (message) return message;
    }
  }

  if (isRecord(err)) {
    const message = nonEmptyString(err.message) ?? nonEmptyString(err.error) ?? nonEmptyString(err.msg) ?? nonEmptyString(err.detail);
    if (message) return message;
  }

  return fallback;
}

/**
 * Alias của extractErrorMessage để đảm bảo tương thích ngược 100%
 */
export const getErrorMessage = extractErrorMessage;

// ─── Dịch mã KEY ───────────────────────────────────────────────────────────────

/** Translator của next-intl (useTranslations / getTranslations) — `has` dùng để tra cứu không phát sinh lỗi MISSING_MESSAGE */
export type Translator = {
  (key: string, values?: Record<string, string | number | Date>): string;
  has?: (key: string) => boolean;
};

const RESPONSE_KEY_PATTERN = /^[A-Z][A-Z0-9_]*$/;

function lookup(t: Translator, key: string): string | undefined {
  if (t.has) {
    return t.has(key) ? t(key) : undefined;
  }
  try {
    const translated = t(key);
    return translated && translated !== key && !translated.endsWith(`.${key}`) ? translated : undefined;
  } catch {
    return undefined;
  }
}

/** Dịch một mã KEY: thử `responses.KEY` → `errors.KEY` → `KEY` trong namespace của translator */
function translateKey(key: string, t: Translator): string | undefined {
  return lookup(t, `responses.${key}`) ?? lookup(t, `errors.${key}`) ?? lookup(t, key);
}

/**
 * Dịch một mã KEY (hoặc nhiều KEY cách nhau bằng dấu phẩy — lỗi validation nhiều trường) sang câu hoàn chỉnh.
 * - Chuỗi không phải KEY (câu văn tự do) được giữ nguyên
 * - Không tìm thấy bản dịch: dùng `fallback` (fallback cũng có thể là KEY)
 */
export function translateMessage(
  keyOrMessage: string | undefined | null,
  fallback?: string,
  t?: Translator
): string {
  const translatedFallback = () =>
    fallback && t && RESPONSE_KEY_PATTERN.test(fallback) ? translateKey(fallback, t) ?? fallback : fallback ?? '';

  if (!keyOrMessage) {
    return translatedFallback();
  }

  if (!t) {
    return keyOrMessage;
  }

  const parts = keyOrMessage.split(',').map((part) => part.trim()).filter(Boolean);
  const isKeyList = parts.length > 0 && parts.every((part) => RESPONSE_KEY_PATTERN.test(part));
  if (!isKeyList) {
    return keyOrMessage;
  }

  const translatedParts = parts.map((part) => translateKey(part, t));
  if (translatedParts.every(Boolean)) {
    return Array.from(new Set(translatedParts)).join(' ');
  }

  // Một phần không có bản dịch -> ưu tiên fallback để người dùng không thấy mã thô
  return fallback ? translatedFallback() : translatedParts.map((text, idx) => text ?? parts[idx]).join(' ');
}

// ─── Tiện ích hiển thị ─────────────────────────────────────────────────────────

/**
 * Trích xuất lỗi từ nhiều định dạng và dịch sang thông điệp hoàn chỉnh
 */
export function resolveErrorMessage(err: unknown, fallback?: string, t?: Translator): string {
  const rawMsg = extractErrorMessage(err, fallback || ERROR_KEYS.DEFAULT_ERROR);
  return translateMessage(rawMsg, fallback, t);
}

/**
 * Trích xuất lỗi, dịch và hiển thị toast lỗi
 * @returns Thông điệp lỗi đã được dịch (để gán vào state / lỗi form nếu cần)
 */
export function notifyError(err: unknown, fallback?: string, t?: Translator): string {
  const message = resolveErrorMessage(err, fallback, t);
  showToast.error(message);
  return message;
}

/**
 * Dịch và hiển thị toast thành công
 */
export function notifySuccess(keyOrMessage: string, fallback?: string, t?: Translator): string {
  const message = translateMessage(keyOrMessage, fallback || keyOrMessage, t);
  showToast.success(message);
  return message;
}

/**
 * Hook tiện ích cho component đã có hàm `t`
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
