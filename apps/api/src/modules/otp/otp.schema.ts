import { z } from 'zod'
import { vietnamPhoneSchema } from '@repo/shared'

export const sendOtpSchema = z.object({
  body: z.object({
    phone: vietnamPhoneSchema,
    purpose: z.enum(['REGISTER', 'LOGIN', 'RESET_PASSWORD']),
  }),
})

export type SendOtpInput = z.infer<typeof sendOtpSchema>
