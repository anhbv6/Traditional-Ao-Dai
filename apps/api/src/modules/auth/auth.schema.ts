import { z } from 'zod'

/**
 * Validation schema for credentials login (email and password)
 */
export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email không đúng định dạng'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  }),
})

export type LoginInput = z.infer<typeof loginSchema>
