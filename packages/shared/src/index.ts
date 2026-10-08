/**
 * @repo/shared — Hợp đồng dữ liệu dùng chung giữa Backend (@repo/api) và Frontend (@repo/web)
 *
 * QUY TẮC:
 * - Chỉ chứa code thuần (không phụ thuộc Express, Next.js, React, Prisma) để chạy được ở cả 2 phía.
 * - Giữ dạng 1 file entry, KHÔNG import tương đối giữa các file (Node chạy thẳng file .ts bằng type-stripping,
 *   cần đuôi .ts cho import tương đối — xung đột với tsc của API). Nếu cần tách, dùng `exports` map trong package.json.
 * - Không dùng `enum` / `namespace` (không tương thích type-stripping) — dùng `as const` + union type.
 * - Thông điệp lỗi của Zod schema luôn là MÃ KEY viết hoa (FE tra bản dịch trong messages/<locale>/errors.json).
 */
import { z } from 'zod'

// ─── Locale ────────────────────────────────────────────────────────────────────

export const LOCALES = ['vi', 'en'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'vi'

/**
 * Chọn bản dịch nội dung từ DB theo quy ước cột: `<field>` = tiếng Việt (mặc định), `<field>En` = tiếng Anh.
 * Thiếu bản tiếng Anh thì rơi về tiếng Việt.
 *
 * @example pickLocalized(product, 'name', 'en') // product.nameEn ?? product.name
 */
export function pickLocalized<T extends Record<string, unknown>, K extends keyof T & string>(
  entity: T,
  field: K,
  locale: Locale
): T[K] {
  if (locale === 'en') {
    const translated = entity[`${field}En` as keyof T]
    if (translated !== null && translated !== undefined && translated !== '') {
      return translated as T[K]
    }
  }
  return entity[field]
}

// ─── Roles ─────────────────────────────────────────────────────────────────────

export const ROLES = ['CUSTOMER', 'STAFF', 'ADMIN'] as const
export type Role = (typeof ROLES)[number]

// ─── API Response Envelope ─────────────────────────────────────────────────────

export interface ApiMeta {
  page?: number
  limit?: number
  totalItems?: number
  totalPages?: number
  [key: string]: unknown
}

/** Response thành công: `message` luôn là mã KEY (ví dụ LOGIN_SUCCESS) */
export interface ApiSuccess<T = unknown> {
  status: 'success'
  statusCode: number
  message?: string
  data?: T
  meta?: ApiMeta
}

export interface ApiFieldError {
  field: string
  message: string
}

/** Response lỗi: `message` luôn là mã KEY (ví dụ INVALID_CREDENTIALS, VALIDATION_ERROR) */
export interface ApiError {
  status: 'error'
  statusCode: number
  message: string
  errors?: ApiFieldError[]
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

// ─── Auth Contracts ────────────────────────────────────────────────────────────

/** Tên cookie phiên — Backend đặt, Frontend/Proxy chỉ đọc. KHÔNG tự ghi các cookie này ở client. */
export const AUTH_COOKIES = {
  /** Refresh token của khách hàng (httpOnly) */
  refreshToken: 'refreshToken',
  /** Cờ báo khách hàng đang có phiên (không httpOnly, không chứa bí mật) — dùng để quyết định có gọi refresh hay không */
  customerSessionHint: 'has_session',
  /** Access token của Admin/Staff (httpOnly, SameSite=Strict) */
  adminToken: 'admin_token',
  /** Vai trò Admin/Staff đang đăng nhập (không httpOnly, chỉ để hiển thị UI — KHÔNG dùng để phân quyền) */
  adminSessionHint: 'admin_session',
} as const

export interface SocialAccountDto {
  id: string
  provider: string
  providerId: string
}

/** Thông tin người dùng trả về cho client (không bao giờ có password) */
export interface UserDto {
  id: string
  email: string | null
  name: string | null
  phone: string | null
  avatar: string | null
  birth?: string | null
  gender?: number
  role: Role
  isActive: boolean
  isEmailVerified?: boolean
  isPhoneVerified?: boolean
  socialAccounts?: SocialAccountDto[]
}

// ─── Validation ────────────────────────────────────────────────────────────────

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

/** Chuẩn hóa SĐT Việt Nam về dạng 0xxxxxxxxx */
export function normalizeVietnamPhone(phone?: string | null): string | null | undefined {
  if (!phone) {
    return phone
  }
  const trimmed = phone.trim()
  return trimmed.startsWith('+84') ? `0${trimmed.slice(3)}` : trimmed
}

// ─── Money ─────────────────────────────────────────────────────────────────────

/**
 * Quy ước tiền tệ: API luôn trả số nguyên VND (number), không trả chuỗi đã định dạng hay Decimal.
 * Định dạng chỉ diễn ra ở UI qua hàm này.
 */
export function formatVnd(amount: number, locale: Locale = DEFAULT_LOCALE): string {
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(amount)
}

/** Chuyển Prisma Decimal / string số về số nguyên VND */
export function toVnd(value: { toString(): string } | number | string | null | undefined): number {
  if (value === null || value === undefined) return 0
  const parsed = Number(typeof value === 'number' ? value : value.toString())
  return Number.isFinite(parsed) ? Math.round(parsed) : 0
}
