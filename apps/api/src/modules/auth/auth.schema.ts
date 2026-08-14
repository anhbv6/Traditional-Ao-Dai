import { z } from 'zod'

const vietnamPhoneSchema = z.string().regex(/^(0|\+84)[35789][0-9]{8}$/, 'Invalid phone number format')

/**
 * Validation schema for credentials login (email and password)
 */
export const loginSchema = z.object({
  body: z.object({
    email: z.string().min(1, 'Email or phone number is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
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
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters').optional(),
})

const emailRegisterSchema = baseRegisterSchema.extend({
  registerType: z.literal('email'),
  email: z.string().email('Invalid email format'),
  phone: vietnamPhoneSchema.optional(),
})

const phoneRegisterSchema = baseRegisterSchema.extend({
  registerType: z.literal('phone'),
  phone: vietnamPhoneSchema,
  email: z.string().email('Invalid email format').optional(),
})

export const registerSchema = z.object({
  body: z.discriminatedUnion('registerType', [
    emailRegisterSchema,
    phoneRegisterSchema,
  ]),
})

export type RegisterInput = z.infer<typeof registerSchema>

/**
 * Validation schema for checking email/phone availability
 */
export const checkAccountSchema = z.object({
  query: z.object({
    email: z.string().email('Invalid email format').optional(),
    phone: vietnamPhoneSchema.optional(),
  }),
})

export type CheckAccountInput = z.infer<typeof checkAccountSchema>
