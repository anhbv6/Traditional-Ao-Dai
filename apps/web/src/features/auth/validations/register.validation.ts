import { VIETNAM_PHONE_REGEX } from '@repo/shared';
import * as z from 'zod';

type RegisterTranslation = (key: string) => string;

export function createRegisterSchema(t: RegisterTranslation) {
  const baseSchema = z.object({
    fullName: z.string()
      .min(2, { message: t('fullNameMin') })
      .max(50, { message: t('fullNameMax') }),
    password: z.string()
      .min(8, { message: t('passwordMin') })
      .regex(/[A-Z]/, { message: t('passwordUpper') })
      .regex(/[a-z]/, { message: t('passwordLower') })
      .regex(/\d/, { message: t('passwordDigit') })
      .regex(/[@$!%*?&]/, { message: t('passwordSpecial') })
      .refine((value) => !/\s/.test(value), { message: t('passwordNoSpace') }),
    confirmPassword: z.string().min(1, { message: t('confirmPasswordRequired') }),
    agreeTerms: z.boolean().refine((value) => value, {
      message: t('agreeTermsError'),
    }),
  });

  const emailRegisterSchema = baseSchema.extend({
    registerType: z.literal('email'),
    email: z.string().email({ message: t('invalidEmail') }),
    phone: z.string().optional(),
  });

  const phoneRegisterSchema = baseSchema.extend({
    registerType: z.literal('phone'),
    phone: z.string().regex(VIETNAM_PHONE_REGEX, {
      message: t('invalidPhone'),
    }),
    email: z.string().optional(),
  });

  return z.discriminatedUnion('registerType', [
    emailRegisterSchema,
    phoneRegisterSchema,
  ]).refine((data) => data.password === data.confirmPassword, {
    message: t('passwordsDoNotMatch'),
    path: ['confirmPassword'],
  });
}

export const registerSchema = createRegisterSchema((key) => key);
