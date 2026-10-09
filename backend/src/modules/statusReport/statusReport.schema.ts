import { z } from 'zod'

export const createStatusReportSchema = z.object({
  stopId: z.number().int(),
  status: z.enum(['ARRIVED', 'DELAYED', 'CROWDED', 'ON_TIME', 'NOT_COMING']),
  note: z.string().max(200).optional(),
})

export const listStatusReportQuerySchema = z.object({
  minutes: z
    .string()
    .regex(/^\d+$/, 'minutes ต้องเป็นตัวเลข')
    .optional(),
})
