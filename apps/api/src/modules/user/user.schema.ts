import { z } from 'zod'

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Tên không được để trống').optional(),
    email: z.string().email('Email không đúng định dạng').optional().nullable(),
    phone: z.string().optional().nullable(),
    avatar: z.string().optional().nullable(),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Ngày sinh không đúng định dạng (YYYY-MM-DD)').or(z.string().length(0)).optional().nullable(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'male', 'female', 'other']).optional(),
  }),
})

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().optional(),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  }),
})

export const linkGoogleSchema = z.object({
  body: z.object({
    credential: z.string().min(1, 'Google ID token (credential) là bắt buộc'),
  }),
})

export const unlinkGoogleSchema = z.object({
  params: z.object({
    providerId: z.string().min(1, 'providerId là bắt buộc'),
  }),
})

export const deleteSessionSchema = z.object({
  params: z.object({
    sessionId: z.string().min(1, 'sessionId là bắt buộc'),
  }),
})
