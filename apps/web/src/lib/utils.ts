import { twMerge } from 'tailwind-merge';

type ClassValue = string | number | false | null | undefined;

/**
 * Ghép class và gộp các class Tailwind xung đột (class đứng sau ghi đè class đứng trước, ví dụ `px-2 px-4` -> `px-4`)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(inputs.filter(Boolean).join(' '));
}

/**
 * Chuẩn hóa `className` của Base UI (chuỗi hoặc hàm nhận state của component) về chuỗi
 */
export function resolveClassName<T>(
  className: string | ((state: T) => string | undefined) | undefined,
  state: T
): string | undefined {
  return typeof className === 'function' ? className(state) : className;
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
