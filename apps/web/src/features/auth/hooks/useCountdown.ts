import { useCallback, useEffect, useState } from 'react';

/** Thời gian chờ gửi lại OTP — khớp cooldown 60 giây phía backend */
export const OTP_RESEND_SECONDS = 60;

/**
 * Đếm ngược theo giây (dùng cho nút "Gửi lại mã").
 * `start()` bắt đầu lại từ `OTP_RESEND_SECONDS`, `reset()` về 0.
 */
export function useCountdown(initialSeconds = 0) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const timeout = setTimeout(() => setSeconds((prev) => Math.max(prev - 1, 0)), 1000);
    return () => clearTimeout(timeout);
  }, [seconds]);

  const start = useCallback((value: number = OTP_RESEND_SECONDS) => setSeconds(value), []);
  const reset = useCallback(() => setSeconds(0), []);

  return { seconds, isRunning: seconds > 0, start, reset };
}
