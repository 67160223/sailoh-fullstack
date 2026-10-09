import { z } from 'zod'

export const addStopSchema = z.object({
  name: z.string().min(1, 'ต้องระบุชื่อป้าย').max(200),
  lat: z.number().optional(),
  lng: z.number().optional(),
  // โฆษณาท้องถิ่น (local ads) — ร้านค้าใกล้ป้ายจ่ายเพื่อให้ขึ้นข้อความสั้น ๆ ตรงรายการป้าย
  sponsorName: z.string().max(100).nullable().optional(),
  sponsorNote: z.string().max(200).nullable().optional(),
})

export const updateStopSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  sequence: z.number().int().min(0).optional(),
  sponsorName: z.string().max(100).nullable().optional(),
  sponsorNote: z.string().max(200).nullable().optional(),
})
