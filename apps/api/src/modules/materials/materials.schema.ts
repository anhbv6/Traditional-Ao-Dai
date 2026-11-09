import { z } from 'zod'
import { LOCALES } from '@repo/shared'

export const listMaterialsSchema = z.object({
  query: z.object({
    locale: z.enum(LOCALES).default('vi'),
  }),
})

export type ListMaterialsQuery = z.infer<typeof listMaterialsSchema>['query']
