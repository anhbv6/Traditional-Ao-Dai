import { z } from 'zod'

export const uploadQuerySchema = z.object({
  query: z.object({
    folder: z.enum(['avatars', 'products', 'general', 'reviews']).optional().default('general'),
  }),
})

export type UploadQueryInput = z.infer<typeof uploadQuerySchema>
