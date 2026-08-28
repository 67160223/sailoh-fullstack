import { z } from 'zod'

export const listUsersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  search: z.string().optional(),
})

export const updateUserSchema = z.object({
  email: z.string().email('รูปแบบอีเมลไม่ถูกต้อง').optional(),
  displayName: z.string().min(1).max(100).optional(),
  role: z.enum(['USER', 'ADMIN']).optional(),
  // เก็บเป็น data URL ตรง ๆ (ไม่มีระบบไฟล์สตอเรจแยกในโปรเจกต์นี้) — จำกัดขนาดไว้กันคน
  // ส่งรูปต้นฉบับที่ไม่ได้ย่อมาก่อน (frontend ย่อเป็น ~256px แล้วค่อยส่งอยู่แล้ว)
  avatarUrl: z
    .string()
    .max(2_000_000, 'ไฟล์รูปใหญ่เกินไป กรุณาใช้รูปที่เล็กลง')
    .nullable()
    .optional(),
})

export const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, 'id ต้องเป็นตัวเลข'),
})

export const usernameParamSchema = z.object({
  username: z.string().min(1),
})
