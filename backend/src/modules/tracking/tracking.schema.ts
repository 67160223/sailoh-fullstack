import { z } from 'zod'

export const upsertLocationSchema = z.object({
  lat: z.number(),
  lng: z.number(),
  nextStopId: z.number().int().optional(),
  status: z.enum(['MOVING', 'DELAYED', 'LAST']).optional(),
})

export const etaQuerySchema = z.object({
  stopId: z.string().regex(/^\d+$/, 'stopId ต้องเป็นตัวเลข'),
})
