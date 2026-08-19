import { z } from 'zod';
import { registerSchema } from '../validations/register.validation';

export type RegisterFormData = z.infer<typeof registerSchema>;
