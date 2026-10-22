import { type z } from 'zod';
import { type registerSchema } from '../validations/register.validation';

export type RegisterFormData = z.infer<typeof registerSchema>;
