import { translateMessage, type Translator } from '@/lib/messages';

/**
 * Dịch message/key trả về từ Backend API sang chuỗi bản địa hóa theo next-intl
 */
export function translateAuthResponse(
  t: Translator,
  message: string | undefined | null,
  fallback: string
): string {
  return translateMessage(message, fallback, t);
}
