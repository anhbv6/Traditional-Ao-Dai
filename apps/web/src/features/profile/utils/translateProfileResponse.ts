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
    return t(`responses.${message}`);
  } catch {
    return fallback;
  }
}
