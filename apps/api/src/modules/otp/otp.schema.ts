import { z } from 'zod'

export const vietnamPhoneSchema = z.string().regex(/^(0|\+84)[35789][0-9]{8}$/, 'Invalid phone number format')

export const sendOtpSchema = z.object({
  body: z.object({
    phone: vietnamPhoneSchema,
    purpose: z.enum(['REGISTER', 'LOGIN', 'RESET_PASSWORD']),
  }),
})

export type SendOtpInput = z.infer<typeof sendOtpSchema>

export const verifyOtpSchema = z.object({
  body: z.object({
    phone: vietnamPhoneSchema,
    purpose: z.enum(['REGISTER', 'LOGIN', 'RESET_PASSWORD']),
    code: z.string().regex(/^\d{6}$/, 'OTP code must be exactly 6 digits'),
  }),
})

export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>
