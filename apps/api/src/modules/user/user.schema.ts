import { z } from 'zod'
import { AUTH_PROVIDERS, GENDERS } from '@repo/shared'
import {
  VIETNAM_PHONE_REGEX,
  emailSchema,
  newPasswordSchema,
  verificationCodeSchema,
  vietnamPhoneSchema as contactPhoneSchema,
} from '@repo/shared/validation'

/** SĐT người nhận hàng: dùng mã lỗi riêng để FE hiển thị đúng ngữ cảnh form địa chỉ */
const vietnamPhoneSchema = z.string().trim().regex(VIETNAM_PHONE_REGEX, 'RECEIVER_PHONE_INVALID')

/**
 * Cập nhật hồ sơ. Email & SĐT KHÔNG đổi ở đây — phải qua luồng xác minh mã (/user/email|phone/verification).
 * Gửi `null` để xóa giá trị (ảnh đại diện, ngày sinh, giới tính).
 */
export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, 'NAME_REQUIRED').max(100, 'NAME_MAX_LENGTH').optional(),
    avatarUrl: z.url('AVATAR_URL_INVALID').nullable().optional(),
    birthDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB_INVALID')
      .refine((value) => !Number.isNaN(Date.parse(value)) && new Date(value) < new Date(), 'DOB_INVALID')
      .nullable()
      .optional(),
    gender: z.enum(GENDERS, 'GENDER_INVALID').nullable().optional(),
  }),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body']

export const changePasswordSchema = z.object({
  body: z.object({
    /** Bỏ trống khi tài khoản chưa có mật khẩu (chỉ đăng nhập Google) -> đây là "đặt mật khẩu" */
    currentPassword: z.string().optional(),
    newPassword: newPasswordSchema,
  }),
})

export const linkGoogleSchema = z.object({
  body: z.object({
    credential: z.string().min(1, 'GOOGLE_CREDENTIAL_REQUIRED'),
  }),
})

export const unlinkSocialSchema = z.object({
  params: z.object({
    provider: z.enum(AUTH_PROVIDERS, 'PROVIDER_INVALID'),
  }),
})

export const deleteSessionSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1, 'SESSION_ID_REQUIRED'),
  }),
})

// ─── Contact Verification Schemas ───────────────────────────────────────────────

export const requestEmailVerificationSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
})

export const confirmEmailVerificationSchema = z.object({
  body: z.object({
    email: emailSchema,
    code: verificationCodeSchema,
  }),
})

export const requestPhoneVerificationSchema = z.object({
  body: z.object({
    phone: contactPhoneSchema,
  }),
})

export const confirmPhoneVerificationSchema = z.object({
  body: z.object({
    phone: contactPhoneSchema,
    code: verificationCodeSchema,
  }),
})

// ─── Address Schemas ────────────────────────────────────────────────────────────

export const createAddressSchema = z.object({
  body: z.object({
    receiverName: z.string().trim().min(1, 'RECEIVER_NAME_REQUIRED'),
    receiverPhone: vietnamPhoneSchema,
    addressLine: z.string().trim().min(1, 'ADDRESS_LINE_REQUIRED'),
    provinceCode: z.string().trim().optional().nullable(),
    provinceName: z.string().trim().min(1, 'PROVINCE_NAME_REQUIRED'),
    districtCode: z.string().trim().optional().nullable(),
    districtName: z.string().trim().min(1, 'DISTRICT_NAME_REQUIRED'),
    wardCode: z.string().trim().optional().nullable(),
    wardName: z.string().trim().min(1, 'WARD_NAME_REQUIRED'),
    postalCode: z.string().trim().optional().nullable(),
    label: z.string().trim().optional().nullable(),
    isDefault: z.boolean().optional(),
  }),
})

export const updateAddressSchema = z.object({
  params: z.object({
    id: z.string().uuid('ADDRESS_ID_INVALID'),
  }),
  body: z.object({
    receiverName: z.string().trim().min(1, 'RECEIVER_NAME_REQUIRED').optional(),
    receiverPhone: vietnamPhoneSchema.optional(),
    addressLine: z.string().trim().min(1, 'ADDRESS_LINE_REQUIRED').optional(),
    provinceCode: z.string().trim().optional().nullable(),
    provinceName: z.string().trim().min(1, 'PROVINCE_NAME_REQUIRED').optional(),
    districtCode: z.string().trim().optional().nullable(),
    districtName: z.string().trim().min(1, 'DISTRICT_NAME_REQUIRED').optional(),
    wardCode: z.string().trim().optional().nullable(),
    wardName: z.string().trim().min(1, 'WARD_NAME_REQUIRED').optional(),
    postalCode: z.string().trim().optional().nullable(),
    label: z.string().trim().optional().nullable(),
    isDefault: z.boolean().optional(),
  }),
})

export const addressIdParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid('ADDRESS_ID_INVALID'),
  }),
})
