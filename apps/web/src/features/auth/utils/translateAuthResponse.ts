type Translator = (key: string, values?: any) => string;

const RESPONSE_KEY_PATTERN = /^[A-Z0-9_]+$/;

/**
 * Dịch message/key trả về từ Backend API sang chuỗi bản địa hóa theo next-intl
 */
export function translateAuthResponse(
  t: Translator,
  message: string | undefined | null,
  fallback: string
): string {
  if (!message) {
    return fallback;
  }

  // Nếu không phải dạng UPPERCASE_KEY thì giữ nguyên (message thông thường)
  if (!RESPONSE_KEY_PATTERN.test(message)) {
    return message;
  }

  // 1. Thử tra cứu trong responses.${message} (ví dụ: responses.INCORRECT_PASSWORD)
  try {
    const resKey = `responses.${message}`;
    const translated = t(resKey);
    if (translated && translated !== resKey) {
      return translated;
    }
  } catch {
    // tiếp tục thử cấp root
  }

  // 2. Thử tra cứu trực tiếp ${message}
  try {
    const translated = t(message);
    if (translated && translated !== message) {
      return translated;
    }
  } catch {
    // fallback
  }

  return fallback;
}
