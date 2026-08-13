import { z } from 'zod'

/**
 * Validation schema for credentials login (email and password)
 */
export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1, 'Email hoặc Số điện thoại là bắt buộc'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  }),
})

export type LoginInput = z.infer<typeof loginSchema>

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  }),
})

export type RefreshTokenInput = z.infer<typeof refreshTokenSchema>

export const logoutSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, 'Refresh token is required').optional(),
  }).optional(),
})

export type LogoutInput = z.infer<typeof logoutSchema>

const baseRegisterSchema = z.object({
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').optional(),
})

const emailRegisterSchema = baseRegisterSchema.extend({
  registerType: z.literal('email'),
  email: z.string().email('Email không đúng định dạng'),
  phone: z.string().regex(/^[0-9]{10,11}$/, 'Số điện thoại không đúng định dạng (10-11 số)').optional(),
})

const phoneRegisterSchema = baseRegisterSchema.extend({
  registerType: z.literal('phone'),
  phone: z.string().regex(/^[0-9]{10,11}$/, 'Số điện thoại không đúng định dạng (10-11 số)'),
  email: z.string().email('Email không đúng định dạng').optional(),
})

export const registerSchema = z.object({
  body: z.discriminatedUnion('registerType', [
    emailRegisterSchema,
    phoneRegisterSchema,
  ])
})

export type RegisterInput = z.infer<typeof registerSchema>

/**
 * Validation schema for checking email/phone availability
 */
export const checkAccountSchema = z.object({
  query: z.object({
    email: z.string().email('Email không đúng định dạng').optional(),
    phone: z.string().regex(/^[0-9]{10,11}$/, 'Số điện thoại không đúng định dạng (10-11 số)').optional(),
  }),
})

export type CheckAccountInput = z.infer<typeof checkAccountSchema>

