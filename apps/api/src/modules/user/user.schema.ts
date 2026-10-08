import { z } from 'zod'
import {
  VIETNAM_PHONE_REGEX,
  emailSchema,
  newPasswordSchema,
  verificationCodeSchema,
  vietnamPhoneSchema as contactPhoneSchema,
} from '@repo/shared'

/** SĐT người nhận hàng: dùng mã lỗi riêng để FE hiển thị đúng ngữ cảnh form địa chỉ */
const vietnamPhoneSchema = z.string().trim().regex(VIETNAM_PHONE_REGEX, 'RECEIVER_PHONE_INVALID')

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'NAME_REQUIRED').optional(),
    email: emailSchema.optional().nullable(),
    phone: z.string().optional().nullable(),
    avatar: z.string().optional().nullable(),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'DOB_INVALID').or(z.string().length(0)).optional().nullable(),
    gender: z.union([
      z.literal(0),
      z.literal(1),
      z.literal(2),
      z.enum(['0', '1', '2', 'MALE', 'FEMALE', 'OTHER', 'male', 'female', 'other']),
    ]).optional(),
  }),
})

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().optional(),
    newPassword: newPasswordSchema,
  }),
})

export const linkGoogleSchema = z.object({
  body: z.object({
    credential: z.string().min(1, 'GOOGLE_CREDENTIAL_REQUIRED'),
  }),
})

export const unlinkGoogleSchema = z.object({
  params: z.object({
    providerId: z.string().min(1, 'PROVIDER_ID_REQUIRED'),
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
