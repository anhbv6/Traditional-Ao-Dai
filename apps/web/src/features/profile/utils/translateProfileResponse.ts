type Translator = (key: string) => string;

const RESPONSE_KEY_PATTERN = /^[A-Z0-9_]+$/;

export function translateProfileResponse(
  t: Translator,
  message: string,
  fallback: string
) {
  if (!message) {
    return fallback;
  }

  if (!RESPONSE_KEY_PATTERN.test(message)) {
    return message;
  }

  try {
    const resKey = `responses.${message}`;
    const translated = t(resKey);
    if (translated && translated !== resKey) {
      return translated;
    }
  } catch {
    return fallback;
  }

  return fallback;
}
