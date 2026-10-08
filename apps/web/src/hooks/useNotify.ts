"use client";

import { useTranslations } from "next-intl";
import { notifyError, showToast, translateMessage } from "@/lib/messages";

/**
 * Hiển thị thông báo đã dịch theo ngôn ngữ hiện tại.
 * - `error(errOrKey, fallbackKey)`: nhận lỗi bất kỳ hoặc mã KEY (kết quả Server Action / API), dịch qua namespace `Errors`
 * - `success(message)`: thông điệp đã dịch sẵn (lấy từ `t(...)` của component)
 * - `translateError(key)`: chỉ dịch, không hiển thị
 */
export function useNotify() {
  const tErrors = useTranslations("Errors");

  return {
    error: (errOrKey: unknown, fallbackKey: string = "DEFAULT_ERROR") => notifyError(errOrKey, fallbackKey, tErrors),
    success: (message: string) => showToast.success(message),
    translateError: (key: string | undefined | null, fallbackKey: string = "DEFAULT_ERROR") =>
      translateMessage(key, fallbackKey, tErrors),
  };
}
