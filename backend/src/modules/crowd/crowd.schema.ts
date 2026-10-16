import { z } from 'zod'

export const createCrowdReportSchema = z.object({
  level: z.enum(['EMPTY', 'MODERATE', 'FULL']),
})
