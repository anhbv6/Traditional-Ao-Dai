/**
 * @repo/shared — Hợp đồng dữ liệu dùng chung giữa Backend (@repo/api) và Frontend (@repo/web)
 *
 * QUY TẮC:
 * - Chỉ chứa code thuần (không phụ thuộc Express, Next.js, React, Prisma) để chạy được ở cả 2 phía.
 * - Giữ dạng 1 file entry, KHÔNG import tương đối giữa các file (Node chạy thẳng file .ts bằng type-stripping,
 *   cần đuôi .ts cho import tương đối — xung đột với tsc của API). Nếu cần tách, dùng `exports` map trong package.json.
 * - Không dùng `enum` / `namespace` (không tương thích type-stripping) — dùng `as const` + union type.
 * - Validator Zod nằm ở `@repo/shared/validation` (src/validation.ts) — entry này KHÔNG import zod để trang không validate
 *   không phải tải zod xuống trình duyệt.
 */

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

/** Vai trò được vào khu quản trị. Mọi vai trò đều mua hàng được ở storefront. */
export const ADMIN_AREA_ROLES = ['STAFF', 'ADMIN'] as const satisfies readonly Role[]

export function isAdminAreaRole(role: string | null | undefined): role is 'STAFF' | 'ADMIN' {
  return role === 'STAFF' || role === 'ADMIN'
}

/**
 * Quyền chi tiết của STAFF — khớp enum `Permission` trong Prisma. ADMIN luôn có toàn quyền.
 * Thứ tự mảng = thứ tự hiển thị trên bảng phân quyền.
 */
export const PERMISSIONS = [
  'MANAGE_ORDERS',
  'UPDATE_TAILORING',
  'MANAGE_INVENTORY',
  'VIEW_REPORTS',
  'MANAGE_CONTENT',
] as const
export type Permission = (typeof PERMISSIONS)[number]

export const USER_STATUSES = ['ACTIVE', 'LOCKED', 'DELETED'] as const
export type UserStatus = (typeof USER_STATUSES)[number]

export const GENDERS = ['MALE', 'FEMALE', 'OTHER'] as const
export type Gender = (typeof GENDERS)[number]

export const AUTH_PROVIDERS = ['GOOGLE'] as const
export type AuthProvider = (typeof AUTH_PROVIDERS)[number]

/** Email luôn được so khớp và lưu ở dạng chữ thường */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

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

/**
 * Khu vực cấp token — giá trị claim `aud` của JWT. Token storefront không vào được khu quản trị và ngược lại
 * (một nhân viên đăng nhập cả hai nơi sẽ có hai phiên độc lập).
 */
export const TOKEN_AUDIENCES = { store: 'store', admin: 'admin' } as const
export type TokenAudience = (typeof TOKEN_AUDIENCES)[keyof typeof TOKEN_AUDIENCES]

/** Phiên quản trị không thao tác quá khoảng này thì hết hạn (ngoài hạn tối đa 1 hoặc 7 ngày) */
export const ADMIN_SESSION_IDLE_TIMEOUT_MS = 8 * 60 * 60 * 1000
/** Chỉ ghi lại `lastUsedAt` khi đã cũ hơn khoảng này — tránh mỗi request đều UPDATE DB */
export const SESSION_TOUCH_INTERVAL_MS = 60 * 1000

/** Claim JWT do Backend ký (RS256) — Web chỉ xác minh, không tự ký */
export interface AuthTokenClaims {
  userId: string
  role: Role
  sessionId: string
  familyId?: string
  tokenType: 'access' | 'refresh'
  rememberMe?: boolean
  aud: TokenAudience
  iat?: number
  exp?: number
}

export interface SocialAccountDto {
  provider: AuthProvider
  email: string | null
  linkedAt: string
}

/** Thông tin người dùng trả về cho client — không bao giờ có passwordHash */
export interface UserDto {
  id: string
  email: string | null
  emailVerified: boolean
  phone: string | null
  phoneVerified: boolean
  name: string | null
  avatarUrl: string | null
  /** Ngày sinh dạng YYYY-MM-DD */
  birthDate: string | null
  gender: Gender | null
  role: Role
  status: UserStatus
  /** Có mật khẩu hay chỉ đăng nhập bằng mạng xã hội (để UI hiện "đặt mật khẩu" thay vì "đổi mật khẩu") */
  hasPassword: boolean
  passwordChangedAt: string | null
  socialAccounts: SocialAccountDto[]
}

// ─── Phone ─────────────────────────────────────────────────────────────────────

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
