import { z } from 'zod'

const plateTypeEnum = z.enum(['ORDINARY', 'AIRCON', 'BRT'])

export const createRouteSchema = z.object({
  number: z.string().min(1, 'ต้องระบุเลขสาย').max(20),
  name: z.string().min(1, 'ต้องระบุชื่อเส้นทาง').max(200),
  plateType: plateTypeEnum.optional(),
  stops: z
    .array(
      z.object({
        name: z.string().min(1),
        lat: z.number().optional(),
        lng: z.number().optional(),
      })
    )
    .optional(),
})

export const updateRouteSchema = z.object({
  number: z.string().min(1).max(20).optional(),
  name: z.string().min(1).max(200).optional(),
  plateType: plateTypeEnum.optional(),
})

export const listRoutesQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
})

export const searchRoutesQuerySchema = z.object({
  q: z.string().optional(),
})
