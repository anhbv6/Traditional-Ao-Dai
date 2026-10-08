import { z } from 'zod'
import {
  emailSchema,
  loginPasswordSchema,
  newPasswordSchema,
  verificationCodeSchema,
  vietnamPhoneSchema,
} from '@repo/shared'

// Mọi thông điệp lỗi là MÃ KEY viết hoa — FE dịch qua messages/<locale>/errors.json

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().min(1, 'EMAIL_OR_PHONE_REQUIRED'),
    password: loginPasswordSchema,
    rememberMe: z.boolean().optional().default(false),
  }),
})

export type LoginInput = z.infer<typeof loginSchema>

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'REFRESH_TOKEN_REQUIRED'),
  }),
})

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'REFRESH_TOKEN_REQUIRED').optional(),
  }).optional(),
})

export type LogoutInput = z.infer<typeof logoutSchema>

const baseRegisterSchema = z.object({
  password: newPasswordSchema,
  name: z.string().trim().min(2, 'NAME_MIN_LENGTH').optional(),
})

const emailRegisterSchema = baseRegisterSchema.extend({
  registerType: z.literal('email'),
  email: emailSchema,
  // Không nhận SĐT khi đăng ký bằng email: SĐT chỉ được gắn vào tài khoản sau khi xác minh OTP
})

const phoneRegisterSchema = baseRegisterSchema.extend({
  registerType: z.literal('phone'),
  phone: vietnamPhoneSchema,
  code: verificationCodeSchema,
  email: emailSchema.optional(),
})

export const registerSchema = z.object({
  body: z.discriminatedUnion('registerType', [
    emailRegisterSchema,
    phoneRegisterSchema,
  ]),
})

export type RegisterInput = z.infer<typeof registerSchema>

export const checkAccountSchema = z.object({
  query: z.object({
    email: emailSchema.optional(),
    phone: vietnamPhoneSchema.optional(),
  }),
})

export type CheckAccountInput = z.infer<typeof checkAccountSchema>

export const otpLoginSchema = z.object({
  body: z.object({
    phone: vietnamPhoneSchema,
    code: verificationCodeSchema,
    rememberMe: z.boolean().optional().default(false),
  }),
})

export type OtpLoginInput = z.infer<typeof otpLoginSchema>

export const googleLoginSchema = z.object({
  body: z.object({
    credential: z.string().min(1, 'GOOGLE_CREDENTIAL_REQUIRED'),
    rememberMe: z.boolean().optional().default(true),
  }),
})

export type GoogleLoginInput = z.infer<typeof googleLoginSchema>

export const forgotPasswordEmailSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
})

export type ForgotPasswordEmailInput = z.infer<typeof forgotPasswordEmailSchema>

export const resetPasswordEmailSchema = z.object({
  body: z.object({
    email: emailSchema,
    code: verificationCodeSchema.optional(),
    resetToken: z.string().min(20, 'RESET_TOKEN_INVALID').optional(),
    password: newPasswordSchema,
  }).refine((data) => data.code || data.resetToken, {
    message: 'VERIFICATION_CODE_OR_RESET_TOKEN_REQUIRED',
    path: ['code'],
  }),
})

export type ResetPasswordEmailInput = z.infer<typeof resetPasswordEmailSchema>

export const resetPasswordPhoneSchema = z.object({
  body: z.object({
    phone: vietnamPhoneSchema,
    code: verificationCodeSchema.optional(),
    resetToken: z.string().min(20, 'RESET_TOKEN_INVALID').optional(),
    password: newPasswordSchema,
  }).refine((data) => data.code || data.resetToken, {
    message: 'OTP_CODE_OR_RESET_TOKEN_REQUIRED',
    path: ['code'],
  }),
})

export type ResetPasswordPhoneInput = z.infer<typeof resetPasswordPhoneSchema>

export const verifyResetPasswordEmailSchema = z.object({
  body: z.object({
    email: emailSchema,
    code: verificationCodeSchema,
  }),
})

export type VerifyResetPasswordEmailInput = z.infer<typeof verifyResetPasswordEmailSchema>

export const verifyResetPasswordPhoneSchema = z.object({
  body: z.object({
    phone: vietnamPhoneSchema,
    code: verificationCodeSchema,
  }),
})

export type VerifyResetPasswordPhoneInput = z.infer<typeof verifyResetPasswordPhoneSchema>
