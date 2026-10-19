import type { ChangeEvent } from 'react';
import type { TextFieldProps } from '@/components/shared/TextField';

/** Cấu hình chung cho mọi ô nhập của form auth: khung viền vuông, cao `md` = nút ActionButton `md` */
export const AUTH_FIELD_PROPS = {
  appearance: 'outline',
  size: 'md',
} as const satisfies Partial<TextFieldProps>;

/** Ô số điện thoại: chỉ giữ chữ số và dấu "+" ngay khi gõ / dán, rồi chuyển tiếp sự kiện */
export function sanitizePhoneChange(handler?: (event: ChangeEvent<HTMLInputElement>) => unknown) {
  return (event: ChangeEvent<HTMLInputElement>) => {
    event.target.value = event.target.value.replace(/[^\d+]/g, '');
    handler?.(event);
  };
}
