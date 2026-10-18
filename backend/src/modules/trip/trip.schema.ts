import { z } from 'zod'

export const planTripQuerySchema = z.object({
  from: z.string().trim().min(1, 'ต้องระบุป้ายต้นทาง').max(100),
  to: z.string().trim().min(1, 'ต้องระบุป้ายปลายทาง').max(100),
})
