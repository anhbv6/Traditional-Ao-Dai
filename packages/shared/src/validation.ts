/**
 * @repo/shared/validation — Validator Zod dùng chung FE/BE
 *
 * Tách khỏi entry chính (`@repo/shared`) để trang chỉ cần hằng số / tiện ích (AUTH_COOKIES, formatVnd...)
 * không phải tải cả thư viện zod xuống trình duyệt. Chỉ import file này ở nơi thật sự validate dữ liệu.
 *
 * QUY TẮC: giống `index.ts` — không import tương đối, không `enum` / `namespace`,
 * thông điệp lỗi luôn là MÃ KEY viết hoa (FE tra bản dịch trong messages/<locale>/errors.json).
 */
import { z } from 'zod'

export const VIETNAM_PHONE_REGEX = /^(0|\+84)[35789][0-9]{8}$/
export const PASSWORD_MIN_LENGTH = 6
/** bcrypt chỉ dùng 72 byte đầu */
export const PASSWORD_MAX_LENGTH = 72
export const VERIFICATION_CODE_LENGTH = 6

export const vietnamPhoneSchema = z.string().trim().regex(VIETNAM_PHONE_REGEX, 'INVALID_PHONE_NUMBER')
export const emailSchema = z.string().trim().email('EMAIL_INVALID')
/** Dùng khi ĐẶT mật khẩu mới (đăng ký, đổi, đặt lại) */
export const newPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, 'PASSWORD_MIN_LENGTH')
  .max(PASSWORD_MAX_LENGTH, 'PASSWORD_MAX_LENGTH')
/** Dùng khi ĐĂNG NHẬP (không giới hạn trên để không chặn mật khẩu cũ) */
export const loginPasswordSchema = z.string().min(PASSWORD_MIN_LENGTH, 'PASSWORD_MIN_LENGTH')
export const verificationCodeSchema = z.string().regex(/^\d{6}$/, 'VERIFICATION_CODE_INVALID')
