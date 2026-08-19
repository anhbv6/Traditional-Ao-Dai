type ClassValue = string | number | false | null | undefined;

export function cn(...inputs: ClassValue[]) {
  return inputs.filter(Boolean).join(' ');
}

/**
 * Wraps a promise to ensure it takes at least the specified minimum time to resolve or reject.
 */
export async function withMinDelay<T>(promise: Promise<T>, minMs = 2000): Promise<T> {
  const startTime = Date.now();
  try {
    const result = await promise;
    const elapsed = Date.now() - startTime;
    const remaining = minMs - elapsed;
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
    return result;
  } catch (error) {
    const elapsed = Date.now() - startTime;
    const remaining = minMs - elapsed;
    if (remaining > 0) {
      await new Promise((resolve) => setTimeout(resolve, remaining));
    }
    throw error;
  }
}
