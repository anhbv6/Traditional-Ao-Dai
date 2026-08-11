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

/**
 * Validation schema for customer registration
 */
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email không đúng định dạng'),
    password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
    name: z.string().min(2, 'Tên phải có ít nhất 2 ký tự').optional(),
    phone: z.string().regex(/^[0-9]{10,11}$/, 'Số điện thoại không đúng định dạng (10-11 số)').optional(),
  }),
})

export type RegisterInput = z.infer<typeof registerSchema>
