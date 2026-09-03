import { translateMessage, type Translator } from '@/lib/messages';

export function translateProfileResponse(
  t: Translator,
  message: string | undefined | null,
  fallback: string
) {
  return translateMessage(message, fallback, t);
}
