import { z } from 'zod'

export const addStopSchema = z.object({
  name: z.string().min(1, 'ต้องระบุชื่อป้าย').max(200),
  lat: z.number().optional(),
  lng: z.number().optional(),
})

export const updateStopSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  sequence: z.number().int().min(0).optional(),
})
